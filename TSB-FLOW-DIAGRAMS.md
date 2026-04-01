# TSB Contract — Full Flow Diagrams

---

## 1. Architecture — Contract Relationships

```mermaid
graph TB
    subgraph "Inheritance & Dependencies"
        TSBShared["TSBShared<br/><i>Roles, Errors, Events, Structs</i>"]
        TSBStorage["TSBStorage<br/><i>State Variables</i>"]
        TSBCore["TSBCore<br/><i>ERC721 + Admin + Metadata + Withdrawal</i>"]
        TSBSatellite["TSBSatellite<br/><i>Other Chains</i>"]
        TSBHub["TSBHub<br/><i>Base Chain - Global Counter</i>"]
        TSBReferral["TSBReferral<br/><i>Referral Registry</i>"]
        OApp["OApp<br/><i>LayerZero v2</i>"]
        ERC721["ERC721<br/><i>OpenZeppelin</i>"]
        AccessControl["AccessControl"]
        Pausable["Pausable"]
        ReentrancyGuard["ReentrancyGuard"]
    end

    TSBShared --> TSBCore
    TSBStorage --> TSBCore
    ERC721 --> TSBCore
    AccessControl --> TSBCore
    Pausable --> TSBCore
    ReentrancyGuard --> TSBCore
    TSBCore --> TSBSatellite
    TSBCore --> TSBHub
    OApp --> TSBSatellite
    OApp --> TSBHub
    TSBHub -- "calls" --> TSBReferral
    TSBShared --> TSBReferral

    subgraph "Cross-Chain via LayerZero v2"
        direction LR
        SAT_LZ["Satellite._lzSend()"]
        HUB_LZ["Hub._lzReceive()"]
        HUB_LZ2["Hub._lzSend()"]
        SAT_LZ2["Satellite._lzReceive()"]
        SAT_LZ -.-> |"MintRequest<br/>MintConfirmed"| HUB_LZ
        HUB_LZ2 -.-> |"MintInstruction<br/>MintFailed"| SAT_LZ2
    end

    style TSBSatellite fill:#4a90d9,color:#fff
    style TSBHub fill:#e67e22,color:#fff
    style TSBReferral fill:#27ae60,color:#fff
    style TSBCore fill:#8e44ad,color:#fff
```

---

## 2. Flow A: Cross-Chain Mint — Happy Path (Satellite → Hub → Satellite → Hub)

```mermaid
sequenceDiagram
    autonumber
    participant U as 👤 User
    participant SAT as 🔵 TSBSatellite<br/>(Arb/Other Chain)
    participant LZ as ⚡ LayerZero v2
    participant HUB as 🟠 TSBHub<br/>(Base Chain)
    participant REF as 🟢 TSBReferral

    Note over U,REF: ═══ FLOW A: CROSS-CHAIN MINT (SUCCESS) ═══

    U->>SAT: mint(paymentToken) / mintWithReferral()
    activate SAT
    SAT->>SAT: Validate: token supported, publicMintOpen,<br/>mintCount < max, no pending request
    SAT->>SAT: Calculate reqId = keccak256(minter, chainId, mintCount, timestamp)
    SAT->>SAT: Store MintRequest{status: PENDING}
    SAT->>SAT: Set pendingMintRequest[minter] = reqId
    SAT->>SAT: Collect payment (ETH or ERC20)

    SAT->>LZ: _lzSend(GMC_EID, MintRequest payload)
    deactivate SAT
    Note right of SAT: 📤 emit MintRequestSent

    LZ->>HUB: _lzReceive() → _handleMintRequest()
    activate HUB
    HUB->>HUB: Check: not duplicate, globalCounter < maxSupply,<br/>globalMintCount < maxMintPerWallet
    HUB->>HUB: tokenId = ++globalCounter
    HUB->>HUB: Store MintRecord{status: PENDING}
    HUB->>REF: recordReferralCode(minter, tokenId, code)
    Note right of HUB: 📤 emit GlobalMintAssigned

    HUB->>HUB: _sendMintInstruction(tokenId)
    HUB->>LZ: externalLzSend(MintInstruction payload)
    HUB->>HUB: status → ASSIGNED
    deactivate HUB
    Note right of HUB: 📤 emit MintStatusUpdated(ASSIGNED)

    LZ->>SAT: _lzReceive() → _handleMintInstruction()
    activate SAT
    SAT->>SAT: Validate: req exists, PENDING, minter match, not claimed
    SAT->>SAT: delete mintRequests[reqId], delete pendingMintRequest
    SAT->>SAT: claimed[tokenId] = true, mintCount++
    SAT->>SAT: _mint(to, tokenId)
    Note right of SAT: 📤 emit MintSuccess ✅

    SAT->>SAT: _sendMintConfirmation(reqId, tokenId)
    SAT->>LZ: externalLzSend(MintConfirmed payload)
    deactivate SAT
    Note right of SAT: 📤 emit MintConfirmationSent

    LZ->>HUB: _lzReceive() → _handleMintConfirmed()
    activate HUB
    HUB->>HUB: records[tokenId].status → MINTED
    deactivate HUB
    Note right of HUB: 📤 emit MintStatusUpdated(MINTED) ✅
```

---

## 3. Flow B: Local Mint on Hub Chain (No Cross-Chain)

```mermaid
sequenceDiagram
    autonumber
    participant U as 👤 User
    participant HUB as 🟠 TSBHub<br/>(Base Chain)
    participant REF as 🟢 TSBReferral

    Note over U,REF: ═══ FLOW B: LOCAL MINT ON HUB (Direct, No Cross-Chain) ═══

    U->>HUB: mint(paymentToken) / mintWithReferral()
    activate HUB
    HUB->>HUB: Validate: globalCounter < maxSupply,<br/>token supported, publicMintOpen,<br/>globalMintCount < maxMintPerWallet
    HUB->>HUB: Collect payment (ETH or ERC20 + refund overpay)
    HUB->>HUB: tokenId = ++globalCounter
    HUB->>HUB: globalMintCount[minter]++, mintCount[minter]++
    HUB->>HUB: Store MintRecord{status: MINTED, originEid: LOCAL_EID}
    HUB->>REF: referralContract.recordReferralCode(minter, tokenId, code)
    Note right of HUB: try/catch → emit ReferralRecordingFailed on error
    HUB->>HUB: _mint(minter, tokenId) - ERC721 mint
    Note right of HUB: 📤 emit GlobalMintAssigned
    Note right of HUB: 📤 emit MintSuccess ✅
    Note right of HUB: 📤 emit MintStatusUpdated(MINTED)
    deactivate HUB
```

---

## 4. Failure 1: Satellite → Hub Message Delivery Fails

```mermaid
sequenceDiagram
    autonumber
    participant U as 👤 User
    participant A as 👑 Admin
    participant SAT as 🔵 TSBSatellite
    participant LZ as ⚡ LayerZero v2
    participant HUB as 🟠 TSBHub

    Note over U,HUB: ═══ FAILURE 1: Satellite → Hub DELIVERY FAILS ═══
    Note over U,HUB: LZ message never arrives at Hub (gas limit too low, etc.)

    U->>SAT: mint(paymentToken)
    SAT->>SAT: Store MintRequest{PENDING}
    SAT->>LZ: _lzSend(MintRequest)
    LZ--xHUB: ❌ Message never delivered

    Note over SAT: Satellite stuck: PENDING forever<br/>Hub has no record at all

    rect rgb(255,235,235)
        Note over U,HUB: RECOVERY OPTIONS

        alt Option 1: User waits 30 min → Expire + Refund
            U->>SAT: expirePendingMint(reqId)
            SAT->>SAT: Validate: PENDING + timestamp > MINT_TIMEOUT
            SAT->>SAT: status → FAILED, delete pendingMintRequest
            Note right of SAT: 📤 emit MintExpired
            U->>SAT: claimRefund(reqId)
            SAT->>SAT: status → REFUNDED
            SAT->>U: Transfer mintPrice back
            Note right of SAT: 📤 emit MintRefunded ✅
        else Option 2: Admin marks failed immediately
            A->>SAT: adminMarkFailed(reqId)
            SAT->>SAT: status → FAILED, delete pendingMintRequest
            Note right of SAT: 📤 emit MintFailed
            U->>SAT: claimRefund(reqId) or retryPendingMint(reqId)
        else Option 3: User retries (after 1 min cooldown)
            U->>SAT: retryPendingMint(reqId)
            SAT->>SAT: old status → REFUNDED
            SAT->>SAT: Create new MintRequest{PENDING} with newReqId
            SAT->>LZ: _lzSend(MintRequest with newReqId)
            Note right of SAT: 📤 emit MintRequestSent
        end
    end
```

---

## 5. Failure 2: Hub → Satellite Reply Fails (TokenId Already Allocated)

```mermaid
sequenceDiagram
    autonumber
    participant U as 👤 User
    participant A as 👑 Admin
    participant SAT as 🔵 TSBSatellite
    participant LZ as ⚡ LayerZero v2
    participant HUB as 🟠 TSBHub

    Note over U,HUB: ═══ FAILURE 2: Hub → Satellite REPLY FAILS ═══
    Note over U,HUB: Hub already allocated tokenId, but MintInstruction fails to deliver

    U->>SAT: mint(paymentToken)
    SAT->>SAT: Store MintRequest{PENDING}
    SAT->>LZ: _lzSend(MintRequest)
    LZ->>HUB: _handleMintRequest()
    HUB->>HUB: tokenId = ++globalCounter
    HUB->>HUB: Store MintRecord{PENDING}

    alt Case 2a: Hub balance insufficient for reply
        HUB->>HUB: _sendMintInstruction → balance < fee
        HUB->>HUB: status → FAILED
        HUB->>HUB: _notifyMintFailed() → also fails (no balance)
        Note over HUB: ❌ Hub FAILED, Satellite still PENDING
    else Case 2b: externalLzSend reverts
        HUB->>LZ: externalLzSend(MintInstruction)
        LZ--xSAT: ❌ catch block
        HUB->>HUB: status → FAILED
        HUB->>HUB: _notifyMintFailed() → best-effort
    else Case 2c: LZ delivers but Satellite gas too low
        HUB->>LZ: externalLzSend(MintInstruction)
        HUB->>HUB: status → ASSIGNED
        LZ--xSAT: ❌ Out of gas on destination
        Note over SAT,HUB: Hub: ASSIGNED, Satellite: still PENDING
    end

    rect rgb(255,235,235)
        Note over U,HUB: RECOVERY OPTIONS

        alt Hub Admin: retry instruction
            A->>HUB: retryMintInstruction(tokenId)
            HUB->>HUB: retryCount++
            HUB->>LZ: _lzSend(MintInstruction)
            HUB->>HUB: status → ASSIGNED
            LZ->>SAT: _handleMintInstruction()
            SAT->>SAT: _mint(to, tokenId)
            Note right of SAT: ✅ Fixed!
        else Hub Admin: cancel + notify
            A->>HUB: adminCancelMint(tokenId)
            HUB->>HUB: status → CANCELED, canceledCount++
            HUB->>LZ: _notifyMintFailedByReq(MintFailed)
            LZ->>SAT: _handleMintFailed()
            SAT->>SAT: status → FAILED
            U->>SAT: claimRefund(reqId)
            Note right of SAT: ✅ User refunded
        else Hub Admin: retry failure notification
            A->>HUB: adminRetryFailureNotification(tokenId)
            HUB->>LZ: _notifyMintFailedByReq(MintFailed)
            LZ->>SAT: _handleMintFailed()
            SAT->>SAT: status → FAILED
            Note right of SAT: ✅ Satellite unblocked
        else User: expire on Satellite after 30 min
            U->>SAT: expirePendingMint(reqId)
            SAT->>SAT: status → FAILED
            U->>SAT: claimRefund(reqId)
            Note right of SAT: ✅ User refunded
            Note over HUB: Admin needs to adminCancelMint to clean Hub record
        end
    end
```

---

## 6. Failure 3: Hub Validation Rejects + MintFailed Notification Fails

```mermaid
sequenceDiagram
    autonumber
    participant U as 👤 User
    participant A as 👑 Admin
    participant SAT as 🔵 TSBSatellite
    participant LZ as ⚡ LayerZero v2
    participant HUB as 🟠 TSBHub

    Note over U,HUB: ═══ FAILURE 3: Hub Validation Rejects Request ═══
    Note over U,HUB: maxSupply reached or maxMintPerWallet exceeded

    U->>SAT: mint(paymentToken)
    SAT->>SAT: Store MintRequest{PENDING}
    SAT->>LZ: _lzSend(MintRequest)
    LZ->>HUB: _handleMintRequest()

    alt Max supply reached
        HUB->>HUB: globalCounter >= maxSupply
        HUB->>HUB: _notifyMintFailedByReq("Max supply reached")
    else Max mint per wallet reached
        HUB->>HUB: globalMintCount >= maxMintPerWallet
        HUB->>HUB: _notifyMintFailedByReq("Max mint per wallet reached")
    else Duplicate request
        HUB->>HUB: processedReq[reqId] == true
        HUB->>HUB: emit DuplicateRequestReceived, return
        Note over HUB: No notification sent - silently skipped
    end

    HUB->>LZ: externalLzSend(MintFailed payload)
    Note right of HUB: 📤 emit MintFailed
    LZ->>SAT: _lzReceive() → _handleMintFailed()
    SAT->>SAT: status → FAILED, delete pendingMintRequest
    Note right of SAT: 📤 emit MintFailed

    U->>SAT: claimRefund(reqId)
    SAT->>SAT: status → REFUNDED
    SAT->>U: Transfer mintPrice back
    Note right of SAT: 📤 emit MintRefunded ✅

    Note over U,HUB: ═══ FAILURE 3b: MintFailed NOTIFICATION FAILS ═══
    Note over U,HUB: Hub has no balance to send MintFailed back

    rect rgb(255,235,235)
        Note over U,HUB: Satellite still PENDING

        alt User: expire after 30 min
            U->>SAT: expirePendingMint(reqId) → FAILED → claimRefund()
        else Admin Satellite: mark failed
            A->>SAT: adminMarkFailed(reqId) → FAILED → user claimRefund()
        end
    end
```

---

## 7. Failure 4: MintConfirmed Delivery Fails (Hub Stuck at ASSIGNED)

```mermaid
sequenceDiagram
    autonumber
    participant U as 👤 User
    participant A as 👑 Admin
    participant SAT as 🔵 TSBSatellite
    participant LZ as ⚡ LayerZero v2
    participant HUB as 🟠 TSBHub

    Note over U,HUB: ═══ FAILURE 4: MintConfirmed FAILS (Satellite minted but Hub doesn't know) ═══

    U->>SAT: mint(paymentToken)
    SAT->>LZ: _lzSend(MintRequest)
    LZ->>HUB: _handleMintRequest()
    HUB->>HUB: tokenId allocated, status: PENDING
    HUB->>LZ: externalLzSend(MintInstruction)
    HUB->>HUB: status → ASSIGNED

    LZ->>SAT: _handleMintInstruction()
    SAT->>SAT: _mint(to, tokenId) ✅ NFT minted!
    SAT->>SAT: _sendMintConfirmation()
    SAT->>LZ: externalLzSend(MintConfirmed)
    LZ--xHUB: ❌ Confirmation never delivered

    Note over HUB: Hub stuck at ASSIGNED forever<br/>But user already has the NFT!

    rect rgb(255,235,235)
        Note over U,HUB: RECOVERY: Admin manually confirms
        A->>HUB: adminMarkMinted(tokenId)
        HUB->>HUB: Validate status == ASSIGNED
        HUB->>HUB: status → MINTED
        Note right of HUB: 📤 emit MintStatusUpdated(MINTED) ✅
    end
```

---

## 8. Failure 5: Race Condition — User Expires During In-Flight Instruction

```mermaid
sequenceDiagram
    autonumber
    participant U as 👤 User
    participant A as 👑 Admin
    participant SAT as 🔵 TSBSatellite
    participant LZ as ⚡ LayerZero v2
    participant HUB as 🟠 TSBHub

    Note over U,HUB: ═══ FAILURE 5: RACE - User expires WHILE Hub instruction in-flight ═══
    Note over U,HUB: User calls expirePendingMint() right before MintInstruction arrives

    U->>SAT: mint(paymentToken)
    SAT->>SAT: Store MintRequest{PENDING}
    SAT->>LZ: _lzSend(MintRequest)
    LZ->>HUB: _handleMintRequest()
    HUB->>HUB: tokenId allocated
    HUB->>LZ: externalLzSend(MintInstruction)

    Note over SAT,HUB: ⏳ 30 minutes pass, MintInstruction still in-flight

    U->>SAT: expirePendingMint(reqId)
    SAT->>SAT: status → FAILED
    U->>SAT: claimRefund(reqId)
    SAT->>SAT: status → REFUNDED

    Note over SAT: Then MintInstruction ARRIVES late...

    LZ->>SAT: _handleMintInstruction()
    SAT->>SAT: Check req.status != PENDING
    SAT->>SAT: Graceful skip!
    Note right of SAT: 📤 emit MintFailed("Request no longer pending")
    Note over SAT: ✅ No double-spend, user already refunded

    rect rgb(255,235,235)
        Note over HUB: Hub record stuck at ASSIGNED
        A->>HUB: adminCancelMint(tokenId) → CANCELED
        Note right of HUB: ✅ Hub cleaned up
    end
```

---

## 9. Flow: retryPendingMint — User Self-Recovery

```mermaid
sequenceDiagram
    autonumber
    participant U as 👤 User
    participant SAT as 🔵 TSBSatellite
    participant LZ as ⚡ LayerZero v2
    participant HUB as 🟠 TSBHub

    Note over U,HUB: ═══ FLOW: retryPendingMint (User Self-Recovery) ═══

    U->>SAT: mint(paymentToken)
    SAT->>SAT: reqId_1 created, MintRequest{PENDING}
    SAT->>LZ: _lzSend(MintRequest)
    LZ--xHUB: ❌ Failed

    Note over SAT: After 1 min cooldown (RETRY_COOLDOWN)

    U->>SAT: retryPendingMint(reqId_1)
    activate SAT
    SAT->>SAT: Validate: minter == msg.sender
    SAT->>SAT: Validate: PENDING + timestamp > RETRY_COOLDOWN
    SAT->>SAT: reqId_1 status → REFUNDED
    SAT->>SAT: reqId_2 = keccak256(minter, chainId, mintCount, timestamp)
    SAT->>SAT: Store new MintRequest{PENDING} for reqId_2
    SAT->>SAT: pendingMintRequest[minter] = reqId_2
    SAT->>LZ: _lzSend(MintRequest with reqId_2)
    deactivate SAT
    Note right of SAT: 📤 emit MintRequestSent(reqId_2)

    LZ->>HUB: _handleMintRequest()
    Note over HUB: reqId_1 never arrived → not in processedReq
    Note over HUB: reqId_2 is new → processes normally
    HUB->>HUB: tokenId allocated
    HUB->>LZ: MintInstruction
    LZ->>SAT: _handleMintInstruction()
    SAT->>SAT: _mint(to, tokenId) ✅
```

---

## 10. State Transitions: Satellite MintStatus vs Hub Status

```mermaid
stateDiagram-v2
    direction LR

    state "TSBSatellite (MintStatus)" as SAT {
        [*] --> PENDING: mint() / mintWithReferral()
        PENDING --> PENDING: Token claimed / minter mismatch<br/>(graceful skip via emit)
        PENDING --> COMPLETED: _handleMintInstruction()<br/>NFT minted + delete request
        PENDING --> FAILED: _handleMintFailed()<br/>Hub sent failure
        PENDING --> FAILED: expirePendingMint()<br/>after 30 min timeout
        PENDING --> FAILED: adminMarkFailed()
        PENDING --> REFUNDED: retryPendingMint()<br/>creates new PENDING
        FAILED --> REFUNDED: claimRefund()<br/>user gets mintPrice back
        FAILED --> REFUNDED: retryPendingMint()<br/>creates new PENDING
    }

    state "TSBHub (Status)" as HUB {
        [*] --> MINTED_H: Local mint()<br/>Direct on Hub chain
        [*] --> PENDING_H: _handleMintRequest()<br/>from Satellite
        PENDING_H --> ASSIGNED: _sendMintInstruction()<br/>LZ send success
        PENDING_H --> FAILED_H: _sendMintInstruction()<br/>balance insufficient or LZ fail
        ASSIGNED --> MINTED_H: _handleMintConfirmed()<br/>Satellite confirms
        ASSIGNED --> MINTED_H: adminMarkMinted()
        ASSIGNED --> ASSIGNED: retryMintInstruction()
        ASSIGNED --> CANCELED: adminCancelMint()
        PENDING_H --> CANCELED: adminCancelMint()
        FAILED_H --> CANCELED: adminCancelMint()
        FAILED_H --> ASSIGNED: retryMintInstruction()
    }

    state PENDING_H: PENDING
    state FAILED_H: FAILED
    state MINTED_H: MINTED
```

---

## 11. Complete Function Map: All Contracts

```mermaid
graph TB
    subgraph "TSBSatellite - All Functions"
        direction TB

        subgraph "User Functions"
            SM["mint(paymentToken)<br/>→ returns bytes32 reqId"]
            SMR["mintWithReferral(paymentToken, code)<br/>→ returns bytes32 reqId"]
            RETRY["retryPendingMint(reqId)<br/>→ old REFUNDED, new PENDING"]
            REFUND["claimRefund(reqId)<br/>→ FAILED → REFUNDED + transfer"]
            EXPIRE["expirePendingMint(reqId)<br/>→ PENDING → FAILED after 30 min"]
        end

        subgraph "Internal / LZ"
            MC["_mintCore(token, code)<br/>→ validates, pays, stores, sends LZ"]
            LZR["_lzReceive()<br/>→ routes MintInstruction / MintFailed"]
            HMI["_handleMintInstruction()<br/>→ validates, _mint(), confirm"]
            HMF["_handleMintFailed()<br/>→ status FAILED"]
            CONF["_sendMintConfirmation()<br/>→ best-effort MintConfirmed to Hub"]
            EXT["externalLzSend()<br/>→ try/catch wrapper for _lzSend"]
        end

        subgraph "Admin Functions"
            AMF["adminMarkFailed(reqId)<br/>→ PENDING → FAILED"]
        end

        subgraph "View Functions"
            QUOTE["quoteLayerZeroFee(minter, code)<br/>→ nativeFee"]
        end

        SM --> MC
        SMR --> MC
        LZR --> HMI
        LZR --> HMF
        HMI --> CONF
        CONF --> EXT
    end

    subgraph "TSBHub - All Functions"
        direction TB

        subgraph "User Functions (Local)"
            HM["mint(paymentToken)"]
            HMR["mintWithReferral(paymentToken, code)"]
        end

        subgraph "Internal / LZ"
            HMC["_mintCore(token, code)<br/>→ direct ERC721 mint, status MINTED"]
            HLZR["_lzReceive()<br/>→ routes MintRequest / MintConfirmed"]
            HHMR["_handleMintRequest(eid, payload)<br/>→ allocate tokenId, send instruction"]
            HHMC["_handleMintConfirmed(payload)<br/>→ ASSIGNED → MINTED"]
            HSMI["_sendMintInstruction(tokenId)<br/>→ send MintInstruction to Satellite"]
            HNMF["_notifyMintFailed(tokenId, reason)<br/>→ send MintFailed"]
            HNMFR["_notifyMintFailedByReq(reqId, eid, minter, reason)<br/>→ send MintFailed before tokenId"]
            HEXT["externalLzSend()<br/>→ try/catch wrapper"]
        end

        subgraph "Admin Functions"
            HRMI["retryMintInstruction(tokenId)<br/>→ resend MintInstruction"]
            HACM["adminCancelMint(tokenId)<br/>→ CANCELED + notify Satellite"]
            HARFN["adminRetryFailureNotification(tokenId)<br/>→ resend MintFailed"]
            HAMM["adminMarkMinted(tokenId)<br/>→ ASSIGNED → MINTED"]
            HSRC["setReferralContract(addr)"]
        end

        subgraph "View Functions"
            HQRF["quoteRetryFee(tokenId) → nativeFee"]
            HERS["effectiveRemainingSupply() → uint256"]
        end

        HM --> HMC
        HMR --> HMC
        HLZR --> HHMR
        HLZR --> HHMC
        HHMR --> HSMI
        HSMI --> HEXT
        HSMI --> HNMF
        HACM --> HNMFR
        HARFN --> HNMFR
    end

    subgraph "TSBCore - Shared Admin"
        direction TB
        META["tokenURI() · setRevealed() · setMetadataURIs()"]
        CONFIG["setPublicMintOpen() · setSupportedToken()<br/>setMaxSupply() · setMaxMintPerWallet()<br/>setExecutorGasLimit() · pause() · unpause()"]
        ROLES["setManager() · setWithdrawer()<br/>proposeSuperAdmin() · acceptSuperAdmin()<br/>cancelAdminTransfer()"]
        WITHDRAW["withdrawNative() · withdrawERC20()"]
    end

    subgraph "TSBReferral"
        direction TB
        RRC["recordReferralCode(user, tokenId, code)"]
        RSRC["setReferralCode(code)"]
        RSAC["setAuthorizedCaller(caller, status)"]
        RGRC["getReferralCode(user)"]
    end

    style SM fill:#2196F3,color:#fff
    style SMR fill:#2196F3,color:#fff
    style HM fill:#FF9800,color:#fff
    style HMR fill:#FF9800,color:#fff
    style AMF fill:#9C27B0,color:#fff
    style HRMI fill:#9C27B0,color:#fff
    style HACM fill:#9C27B0,color:#fff
    style HARFN fill:#9C27B0,color:#fff
    style HAMM fill:#9C27B0,color:#fff
    style EXPIRE fill:#f44336,color:#fff
    style REFUND fill:#4CAF50,color:#fff
    style RETRY fill:#FF5722,color:#fff
```
