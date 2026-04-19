export const tsbSatelliteABI = [
  {
    type: 'constructor',
    inputs: [
      {
        name: '_endpoint',
        type: 'address',
        internalType: 'address',
      },
      {
        name: '_gmcEid',
        type: 'uint32',
        internalType: 'uint32',
      },
      {
        name: '_admin',
        type: 'address',
        internalType: 'address',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'receive',
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'DEFAULT_ADMIN_ROLE',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'bytes32',
        internalType: 'bytes32',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'GMC_EID',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'uint32',
        internalType: 'uint32',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'MANAGER_ROLE',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'bytes32',
        internalType: 'bytes32',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'MINT_TIMEOUT',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'WITHDRAWER_ROLE',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'bytes32',
        internalType: 'bytes32',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'acceptOwnership',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'acceptSuperAdmin',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'adminMarkFailed',
    inputs: [
      {
        name: 'reqId',
        type: 'bytes32',
        internalType: 'bytes32',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'adminTransferProposer',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'address',
        internalType: 'address',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'allowInitializePath',
    inputs: [
      {
        name: 'origin',
        type: 'tuple',
        internalType: 'struct Origin',
        components: [
          {
            name: 'srcEid',
            type: 'uint32',
            internalType: 'uint32',
          },
          {
            name: 'sender',
            type: 'bytes32',
            internalType: 'bytes32',
          },
          {
            name: 'nonce',
            type: 'uint64',
            internalType: 'uint64',
          },
        ],
      },
    ],
    outputs: [
      {
        name: '',
        type: 'bool',
        internalType: 'bool',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'approve',
    inputs: [
      {
        name: 'to',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'tokenId',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [
      {
        name: 'owner',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'baseTokenURI',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'string',
        internalType: 'string',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'cancelAdminTransfer',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'cancelOwnershipTransfer',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'claimRefund',
    inputs: [
      {
        name: 'reqId',
        type: 'bytes32',
        internalType: 'bytes32',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'claimed',
    inputs: [
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'bool',
        internalType: 'bool',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'combineOptions',
    inputs: [
      {
        name: '_eid',
        type: 'uint32',
        internalType: 'uint32',
      },
      {
        name: '_msgType',
        type: 'uint16',
        internalType: 'uint16',
      },
      {
        name: '_extraOptions',
        type: 'bytes',
        internalType: 'bytes',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'bytes',
        internalType: 'bytes',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'endpoint',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'address',
        internalType: 'contract ILayerZeroEndpointV2',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'enforcedOptions',
    inputs: [
      {
        name: 'eid',
        type: 'uint32',
        internalType: 'uint32',
      },
      {
        name: 'msgType',
        type: 'uint16',
        internalType: 'uint16',
      },
    ],
    outputs: [
      {
        name: 'enforcedOption',
        type: 'bytes',
        internalType: 'bytes',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'executorGasLimit',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'uint128',
        internalType: 'uint128',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'expirePendingMint',
    inputs: [
      {
        name: 'reqId',
        type: 'bytes32',
        internalType: 'bytes32',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'externalLzSend',
    inputs: [
      {
        name: 'dstEid',
        type: 'uint32',
        internalType: 'uint32',
      },
      {
        name: 'payload',
        type: 'bytes',
        internalType: 'bytes',
      },
      {
        name: 'options',
        type: 'bytes',
        internalType: 'bytes',
      },
      {
        name: 'fee',
        type: 'tuple',
        internalType: 'struct MessagingFee',
        components: [
          {
            name: 'nativeFee',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'lzTokenFee',
            type: 'uint256',
            internalType: 'uint256',
          },
        ],
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getApproved',
    inputs: [
      {
        name: 'tokenId',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'address',
        internalType: 'address',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getRoleAdmin',
    inputs: [
      {
        name: 'role',
        type: 'bytes32',
        internalType: 'bytes32',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'bytes32',
        internalType: 'bytes32',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'grantRole',
    inputs: [
      {
        name: 'role',
        type: 'bytes32',
        internalType: 'bytes32',
      },
      {
        name: 'account',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'hasRole',
    inputs: [
      {
        name: 'role',
        type: 'bytes32',
        internalType: 'bytes32',
      },
      {
        name: 'account',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'bool',
        internalType: 'bool',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'hiddenMetadataUri',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'string',
        internalType: 'string',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'highestTokenId',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'isApprovedForAll',
    inputs: [
      {
        name: 'owner',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'operator',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'bool',
        internalType: 'bool',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'isComposeMsgSender',
    inputs: [
      {
        name: '',
        type: 'tuple',
        internalType: 'struct Origin',
        components: [
          {
            name: 'srcEid',
            type: 'uint32',
            internalType: 'uint32',
          },
          {
            name: 'sender',
            type: 'bytes32',
            internalType: 'bytes32',
          },
          {
            name: 'nonce',
            type: 'uint64',
            internalType: 'uint64',
          },
        ],
      },
      {
        name: '',
        type: 'bytes',
        internalType: 'bytes',
      },
      {
        name: '_sender',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'bool',
        internalType: 'bool',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'lzReceive',
    inputs: [
      {
        name: '_origin',
        type: 'tuple',
        internalType: 'struct Origin',
        components: [
          {
            name: 'srcEid',
            type: 'uint32',
            internalType: 'uint32',
          },
          {
            name: 'sender',
            type: 'bytes32',
            internalType: 'bytes32',
          },
          {
            name: 'nonce',
            type: 'uint64',
            internalType: 'uint64',
          },
        ],
      },
      {
        name: '_guid',
        type: 'bytes32',
        internalType: 'bytes32',
      },
      {
        name: '_message',
        type: 'bytes',
        internalType: 'bytes',
      },
      {
        name: '_executor',
        type: 'address',
        internalType: 'address',
      },
      {
        name: '_extraData',
        type: 'bytes',
        internalType: 'bytes',
      },
    ],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'mint',
    inputs: [
      {
        name: '_paymentToken',
        type: 'address',
        internalType: 'address',
      },
      {
        name: '_referralCode',
        type: 'string',
        internalType: 'string',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'bytes32',
        internalType: 'bytes32',
      },
    ],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'mintCount',
    inputs: [
      {
        name: '',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'mintPrices',
    inputs: [
      {
        name: '',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'mintRequests',
    inputs: [
      {
        name: '',
        type: 'bytes32',
        internalType: 'bytes32',
      },
    ],
    outputs: [
      {
        name: 'minter',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'status',
        type: 'uint8',
        internalType: 'enum MintStatus',
      },
      {
        name: 'timestamp',
        type: 'uint40',
        internalType: 'uint40',
      },
      {
        name: 'paymentToken',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'mintPrice',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'referralCode',
        type: 'string',
        internalType: 'string',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'name',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'string',
        internalType: 'string',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'nextNonce',
    inputs: [
      {
        name: '',
        type: 'uint32',
        internalType: 'uint32',
      },
      {
        name: '',
        type: 'bytes32',
        internalType: 'bytes32',
      },
    ],
    outputs: [
      {
        name: 'nonce',
        type: 'uint64',
        internalType: 'uint64',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'oAppVersion',
    inputs: [],
    outputs: [
      {
        name: 'senderVersion',
        type: 'uint64',
        internalType: 'uint64',
      },
      {
        name: 'receiverVersion',
        type: 'uint64',
        internalType: 'uint64',
      },
    ],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    name: 'owner',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'address',
        internalType: 'address',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'ownerOf',
    inputs: [
      {
        name: 'tokenId',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'address',
        internalType: 'address',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'pause',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'paused',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'bool',
        internalType: 'bool',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'peers',
    inputs: [
      {
        name: 'eid',
        type: 'uint32',
        internalType: 'uint32',
      },
    ],
    outputs: [
      {
        name: 'peer',
        type: 'bytes32',
        internalType: 'bytes32',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'pendingAdmin',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'address',
        internalType: 'address',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'pendingMintRequest',
    inputs: [
      {
        name: '',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'bytes32',
        internalType: 'bytes32',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'pendingOAppOwner',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'address',
        internalType: 'address',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'proposeSuperAdmin',
    inputs: [
      {
        name: '_newAdmin',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'publicMintOpen',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'bool',
        internalType: 'bool',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'quoteLayerZeroFee',
    inputs: [
      {
        name: '_minter',
        type: 'address',
        internalType: 'address',
      },
      {
        name: '_referralCode',
        type: 'string',
        internalType: 'string',
      },
    ],
    outputs: [
      {
        name: 'nativeFee',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'renounceOwnership',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'renounceRole',
    inputs: [
      {
        name: 'role',
        type: 'bytes32',
        internalType: 'bytes32',
      },
      {
        name: 'callerConfirmation',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'retryPendingMint',
    inputs: [
      {
        name: 'reqId',
        type: 'bytes32',
        internalType: 'bytes32',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'revealed',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'bool',
        internalType: 'bool',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'revokeRole',
    inputs: [
      {
        name: 'role',
        type: 'bytes32',
        internalType: 'bytes32',
      },
      {
        name: 'account',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'safeTransferFrom',
    inputs: [
      {
        name: 'from',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'to',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'tokenId',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'safeTransferFrom',
    inputs: [
      {
        name: 'from',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'to',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'tokenId',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'data',
        type: 'bytes',
        internalType: 'bytes',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'setApprovalForAll',
    inputs: [
      {
        name: 'operator',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'approved',
        type: 'bool',
        internalType: 'bool',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'setDelegate',
    inputs: [
      {
        name: '_delegate',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'setEnforcedOptions',
    inputs: [
      {
        name: '_enforcedOptions',
        type: 'tuple[]',
        internalType: 'struct EnforcedOptionParam[]',
        components: [
          {
            name: 'eid',
            type: 'uint32',
            internalType: 'uint32',
          },
          {
            name: 'msgType',
            type: 'uint16',
            internalType: 'uint16',
          },
          {
            name: 'options',
            type: 'bytes',
            internalType: 'bytes',
          },
        ],
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'setExecutorGasLimit',
    inputs: [
      {
        name: '_gasLimit',
        type: 'uint128',
        internalType: 'uint128',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'setManager',
    inputs: [
      {
        name: '_user',
        type: 'address',
        internalType: 'address',
      },
      {
        name: '_status',
        type: 'bool',
        internalType: 'bool',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'setMetadataUris',
    inputs: [
      {
        name: '_hiddenUri',
        type: 'string',
        internalType: 'string',
      },
      {
        name: '_baseUri',
        type: 'string',
        internalType: 'string',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'setPeer',
    inputs: [
      {
        name: '_eid',
        type: 'uint32',
        internalType: 'uint32',
      },
      {
        name: '_peer',
        type: 'bytes32',
        internalType: 'bytes32',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'setPublicMintOpen',
    inputs: [
      {
        name: '_isOpen',
        type: 'bool',
        internalType: 'bool',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'setRevealed',
    inputs: [
      {
        name: '_state',
        type: 'bool',
        internalType: 'bool',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'setSupportedToken',
    inputs: [
      {
        name: '_token',
        type: 'address',
        internalType: 'address',
      },
      {
        name: '_price',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: '_active',
        type: 'bool',
        internalType: 'bool',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'setWithdrawer',
    inputs: [
      {
        name: '_user',
        type: 'address',
        internalType: 'address',
      },
      {
        name: '_status',
        type: 'bool',
        internalType: 'bool',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'supportedTokens',
    inputs: [
      {
        name: '',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'bool',
        internalType: 'bool',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'supportsInterface',
    inputs: [
      {
        name: 'interfaceId',
        type: 'bytes4',
        internalType: 'bytes4',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'bool',
        internalType: 'bool',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'symbol',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'string',
        internalType: 'string',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'tokenURI',
    inputs: [
      {
        name: 'tokenId',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'string',
        internalType: 'string',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'transferFrom',
    inputs: [
      {
        name: 'from',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'to',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'tokenId',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'transferOwnership',
    inputs: [
      {
        name: '_newOwner',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'unpause',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'withdrawERC20',
    inputs: [
      {
        name: '_token',
        type: 'address',
        internalType: 'address',
      },
      {
        name: '_to',
        type: 'address',
        internalType: 'address',
      },
      {
        name: '_amount',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'withdrawNative',
    inputs: [
      {
        name: '_to',
        type: 'address',
        internalType: 'address payable',
      },
      {
        name: '_amount',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    name: 'AdminTransferAccepted',
    inputs: [
      {
        name: 'newAdmin',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'AdminTransferProposed',
    inputs: [
      {
        name: 'currentAdmin',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'pendingAdmin',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'Approval',
    inputs: [
      {
        name: 'owner',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'approved',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'tokenId',
        type: 'uint256',
        indexed: true,
        internalType: 'uint256',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'ApprovalForAll',
    inputs: [
      {
        name: 'owner',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'operator',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'approved',
        type: 'bool',
        indexed: false,
        internalType: 'bool',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'BatchMetadataUpdate',
    inputs: [
      {
        name: '_fromTokenId',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
      {
        name: '_toTokenId',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'Deposited',
    inputs: [
      {
        name: 'from',
        type: 'address',
        indexed: false,
        internalType: 'address',
      },
      {
        name: 'amount',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'EnforcedOptionSet',
    inputs: [
      {
        name: '_enforcedOptions',
        type: 'tuple[]',
        indexed: false,
        internalType: 'struct EnforcedOptionParam[]',
        components: [
          {
            name: 'eid',
            type: 'uint32',
            internalType: 'uint32',
          },
          {
            name: 'msgType',
            type: 'uint16',
            internalType: 'uint16',
          },
          {
            name: 'options',
            type: 'bytes',
            internalType: 'bytes',
          },
        ],
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'ExecutorGasLimitUpdated',
    inputs: [
      {
        name: 'newLimit',
        type: 'uint128',
        indexed: false,
        internalType: 'uint128',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'MaxMintUpdated',
    inputs: [
      {
        name: 'newLimit',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'MaxSupplyUpdated',
    inputs: [
      {
        name: 'newSupply',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'MetadataUpdate',
    inputs: [
      {
        name: '_tokenId',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'MetadataUriUpdated',
    inputs: [
      {
        name: 'hiddenUri',
        type: 'string',
        indexed: false,
        internalType: 'string',
      },
      {
        name: 'baseUri',
        type: 'string',
        indexed: false,
        internalType: 'string',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'MintConfirmationSent',
    inputs: [
      {
        name: 'reqId',
        type: 'bytes32',
        indexed: true,
        internalType: 'bytes32',
      },
      {
        name: 'tokenId',
        type: 'uint256',
        indexed: true,
        internalType: 'uint256',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'MintExpired',
    inputs: [
      {
        name: 'minter',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'reqId',
        type: 'bytes32',
        indexed: true,
        internalType: 'bytes32',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'MintFailed',
    inputs: [
      {
        name: 'minter',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'reqId',
        type: 'bytes32',
        indexed: true,
        internalType: 'bytes32',
      },
      {
        name: 'reason',
        type: 'string',
        indexed: false,
        internalType: 'string',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'MintRefunded',
    inputs: [
      {
        name: 'minter',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'reqId',
        type: 'bytes32',
        indexed: true,
        internalType: 'bytes32',
      },
      {
        name: 'amount',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'MintRequestSent',
    inputs: [
      {
        name: 'minter',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'reqId',
        type: 'bytes32',
        indexed: true,
        internalType: 'bytes32',
      },
      {
        name: 'lzFee',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
      {
        name: 'mintPrice',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
      {
        name: 'paymentToken',
        type: 'address',
        indexed: false,
        internalType: 'address',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'MintSuccess',
    inputs: [
      {
        name: 'minter',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'tokenId',
        type: 'uint256',
        indexed: true,
        internalType: 'uint256',
      },
      {
        name: 'chainId',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
      {
        name: 'paymentToken',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'OAppOwnershipTransferAccepted',
    inputs: [
      {
        name: 'newOwner',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'OAppOwnershipTransferProposed',
    inputs: [
      {
        name: 'currentOwner',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'pendingOwner',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'OwnershipTransferred',
    inputs: [
      {
        name: 'previousOwner',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'newOwner',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'Paused',
    inputs: [
      {
        name: 'account',
        type: 'address',
        indexed: false,
        internalType: 'address',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'PaymentTokenUpdated',
    inputs: [
      {
        name: 'token',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'newPrice',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
      {
        name: 'active',
        type: 'bool',
        indexed: false,
        internalType: 'bool',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'PeerSet',
    inputs: [
      {
        name: 'eid',
        type: 'uint32',
        indexed: false,
        internalType: 'uint32',
      },
      {
        name: 'peer',
        type: 'bytes32',
        indexed: false,
        internalType: 'bytes32',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'PublicMintStatusUpdated',
    inputs: [
      {
        name: 'isOpen',
        type: 'bool',
        indexed: false,
        internalType: 'bool',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'RevealStatusUpdated',
    inputs: [
      {
        name: 'revealed',
        type: 'bool',
        indexed: false,
        internalType: 'bool',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'RoleAdminChanged',
    inputs: [
      {
        name: 'role',
        type: 'bytes32',
        indexed: true,
        internalType: 'bytes32',
      },
      {
        name: 'previousAdminRole',
        type: 'bytes32',
        indexed: true,
        internalType: 'bytes32',
      },
      {
        name: 'newAdminRole',
        type: 'bytes32',
        indexed: true,
        internalType: 'bytes32',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'RoleGranted',
    inputs: [
      {
        name: 'role',
        type: 'bytes32',
        indexed: true,
        internalType: 'bytes32',
      },
      {
        name: 'account',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'sender',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'RoleRevoked',
    inputs: [
      {
        name: 'role',
        type: 'bytes32',
        indexed: true,
        internalType: 'bytes32',
      },
      {
        name: 'account',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'sender',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'RoleStatusUpdated',
    inputs: [
      {
        name: 'role',
        type: 'bytes32',
        indexed: true,
        internalType: 'bytes32',
      },
      {
        name: 'user',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'status',
        type: 'bool',
        indexed: false,
        internalType: 'bool',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'Transfer',
    inputs: [
      {
        name: 'from',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'to',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'tokenId',
        type: 'uint256',
        indexed: true,
        internalType: 'uint256',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'Unpaused',
    inputs: [
      {
        name: 'account',
        type: 'address',
        indexed: false,
        internalType: 'address',
      },
    ],
    anonymous: false,
  },
  {
    type: 'error',
    name: 'AccessControlBadConfirmation',
    inputs: [],
  },
  {
    type: 'error',
    name: 'AccessControlUnauthorizedAccount',
    inputs: [
      {
        name: 'account',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'neededRole',
        type: 'bytes32',
        internalType: 'bytes32',
      },
    ],
  },
  {
    type: 'error',
    name: 'ERC721IncorrectOwner',
    inputs: [
      {
        name: 'sender',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'tokenId',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'owner',
        type: 'address',
        internalType: 'address',
      },
    ],
  },
  {
    type: 'error',
    name: 'ERC721InsufficientApproval',
    inputs: [
      {
        name: 'operator',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'tokenId',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'error',
    name: 'ERC721InvalidApprover',
    inputs: [
      {
        name: 'approver',
        type: 'address',
        internalType: 'address',
      },
    ],
  },
  {
    type: 'error',
    name: 'ERC721InvalidOperator',
    inputs: [
      {
        name: 'operator',
        type: 'address',
        internalType: 'address',
      },
    ],
  },
  {
    type: 'error',
    name: 'ERC721InvalidOwner',
    inputs: [
      {
        name: 'owner',
        type: 'address',
        internalType: 'address',
      },
    ],
  },
  {
    type: 'error',
    name: 'ERC721InvalidReceiver',
    inputs: [
      {
        name: 'receiver',
        type: 'address',
        internalType: 'address',
      },
    ],
  },
  {
    type: 'error',
    name: 'ERC721InvalidSender',
    inputs: [
      {
        name: 'sender',
        type: 'address',
        internalType: 'address',
      },
    ],
  },
  {
    type: 'error',
    name: 'ERC721NonexistentToken',
    inputs: [
      {
        name: 'tokenId',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'error',
    name: 'EnforcedPause',
    inputs: [],
  },
  {
    type: 'error',
    name: 'ExpectedPause',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InvalidDelegate',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InvalidEndpointCall',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InvalidOptionType',
    inputs: [
      {
        name: 'optionType',
        type: 'uint16',
        internalType: 'uint16',
      },
    ],
  },
  {
    type: 'error',
    name: 'InvalidOptions',
    inputs: [
      {
        name: 'options',
        type: 'bytes',
        internalType: 'bytes',
      },
    ],
  },
  {
    type: 'error',
    name: 'LzTokenUnavailable',
    inputs: [],
  },
  {
    type: 'error',
    name: 'NoPeer',
    inputs: [
      {
        name: 'eid',
        type: 'uint32',
        internalType: 'uint32',
      },
    ],
  },
  {
    type: 'error',
    name: 'NotEnoughNative',
    inputs: [
      {
        name: 'msgValue',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'error',
    name: 'OnlyEndpoint',
    inputs: [
      {
        name: 'addr',
        type: 'address',
        internalType: 'address',
      },
    ],
  },
  {
    type: 'error',
    name: 'OnlyPeer',
    inputs: [
      {
        name: 'eid',
        type: 'uint32',
        internalType: 'uint32',
      },
      {
        name: 'sender',
        type: 'bytes32',
        internalType: 'bytes32',
      },
    ],
  },
  {
    type: 'error',
    name: 'OwnableInvalidOwner',
    inputs: [
      {
        name: 'owner',
        type: 'address',
        internalType: 'address',
      },
    ],
  },
  {
    type: 'error',
    name: 'OwnableUnauthorizedAccount',
    inputs: [
      {
        name: 'account',
        type: 'address',
        internalType: 'address',
      },
    ],
  },
  {
    type: 'error',
    name: 'ReentrancyGuardReentrantCall',
    inputs: [],
  },
  {
    type: 'error',
    name: 'SafeCastOverflowedUintDowncast',
    inputs: [
      {
        name: 'bits',
        type: 'uint8',
        internalType: 'uint8',
      },
      {
        name: 'value',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'error',
    name: 'SafeERC20FailedOperation',
    inputs: [
      {
        name: 'token',
        type: 'address',
        internalType: 'address',
      },
    ],
  },
  {
    type: 'error',
    name: 'TSBSatellite__AlreadyClaimed',
    inputs: [
      {
        name: 'tokenId',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'error',
    name: 'TSBSatellite__GMCEidNotSet',
    inputs: [],
  },
  {
    type: 'error',
    name: 'TSBSatellite__InvalidGMCEid',
    inputs: [
      {
        name: 'receivedEid',
        type: 'uint32',
        internalType: 'uint32',
      },
    ],
  },
  {
    type: 'error',
    name: 'TSBSatellite__InvalidRequestId',
    inputs: [
      {
        name: 'reqId',
        type: 'bytes32',
        internalType: 'bytes32',
      },
    ],
  },
  {
    type: 'error',
    name: 'TSBSatellite__InvalidStatus',
    inputs: [
      {
        name: 'status',
        type: 'uint8',
        internalType: 'uint8',
      },
    ],
  },
  {
    type: 'error',
    name: 'TSBSatellite__MintAlreadyPending',
    inputs: [
      {
        name: 'user',
        type: 'address',
        internalType: 'address',
      },
    ],
  },
  {
    type: 'error',
    name: 'TSBSatellite__MinterMismatch',
    inputs: [
      {
        name: 'expected',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'actual',
        type: 'address',
        internalType: 'address',
      },
    ],
  },
  {
    type: 'error',
    name: 'TSBSatellite__OnlyContractSelf',
    inputs: [],
  },
  {
    type: 'error',
    name: 'TSBSatellite__TimeoutNotReached',
    inputs: [
      {
        name: 'timeRemaining',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'error',
    name: 'TSBShared__EthSentWithERC20',
    inputs: [
      {
        name: 'amount',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'error',
    name: 'TSBShared__EthTransferFailed',
    inputs: [],
  },
  {
    type: 'error',
    name: 'TSBShared__InsufficientContractBalance',
    inputs: [
      {
        name: 'contractBalance',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'gasRequired',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'error',
    name: 'TSBShared__InsufficientMintPrice',
    inputs: [
      {
        name: 'provided',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'price',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'error',
    name: 'TSBShared__InvalidAddress',
    inputs: [],
  },
  {
    type: 'error',
    name: 'TSBShared__InvalidGasLimit',
    inputs: [],
  },
  {
    type: 'error',
    name: 'TSBShared__InvalidReferralCode',
    inputs: [],
  },
  {
    type: 'error',
    name: 'TSBShared__MaxMintReached',
    inputs: [
      {
        name: 'user',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'limit',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'error',
    name: 'TSBShared__MaxSupplyReached',
    inputs: [],
  },
  {
    type: 'error',
    name: 'TSBShared__PaymentTokenNotSupported',
    inputs: [
      {
        name: 'token',
        type: 'address',
        internalType: 'address',
      },
    ],
  },
  {
    type: 'error',
    name: 'TSBShared__PublicMintClosed',
    inputs: [],
  },
  {
    type: 'error',
    name: 'TSBShared__Unauthorized',
    inputs: [],
  },
  {
    type: 'error',
    name: 'TSBShared__UnsupportedMsgType',
    inputs: [
      {
        name: 'msgType',
        type: 'uint8',
        internalType: 'enum MsgType',
      },
    ],
  },
] as const
