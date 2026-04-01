'use client'

import { useMemo } from 'react'
import DOMPurify from 'dompurify'

interface SanitizedHTMLProps {
  html: string
  className?: string
  allowedTags?: string[]
  allowedAttributes?: string[]
}

/**
 * Safely renders HTML content by sanitizing it with DOMPurify
 * Use this component for user-generated HTML content
 */
export default function SanitizedHTML({
  html,
  className = '',
  allowedTags,
  allowedAttributes,
}: SanitizedHTMLProps) {
  const sanitizedContent = useMemo(() => {
    // Default safe configuration
    const config = {
      ALLOWED_TAGS: allowedTags || [
        'p',
        'br',
        'strong',
        'em',
        'u',
        'a',
        'ul',
        'ol',
        'li',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'blockquote',
        'code',
        'pre',
        'span',
        'div',
        'img',
      ],
      ALLOWED_ATTR: allowedAttributes || [
        'href',
        'target',
        'rel',
        'class',
        'id',
        'src',
        'alt',
        'title',
        'width',
        'height',
      ],
      ALLOW_DATA_ATTR: false,
      ADD_ATTR: ['target'], // Allow target attribute for links
    }

    // Sanitize the HTML
    return DOMPurify.sanitize(html, config)
  }, [html, allowedTags, allowedAttributes])

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  )
}
