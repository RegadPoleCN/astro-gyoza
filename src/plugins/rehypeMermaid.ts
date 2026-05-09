import { h } from 'hastscript'
import { visit } from 'unist-util-visit'
import type { Element, Root, Text } from 'hast'

const MERMAID_CLASS_PATTERN = /^(language-|lang-)?mermaid$/i

function isMermaidCodeBlock(node: Element): boolean {
  if (node.tagName !== 'pre') return false

  const codeChild = node.children[0]
  if (
    !codeChild ||
    codeChild.type !== 'element' ||
    codeChild.tagName !== 'code' ||
    !codeChild.properties
  ) {
    return false
  }

  const classes = codeChild.properties.className
  if (!classes) return false

  // Handle both string and array className
  const classArray = Array.isArray(classes) ? classes : [String(classes)]
  return classArray.some((cls) => MERMAID_CLASS_PATTERN.test(String(cls)))
}

function extractTextFromNode(node: Element | Text): string {
  if (node.type === 'text') {
    return node.value
  }

  if (node.type === 'element') {
    return node.children.map((child) => extractTextFromNode(child as Element | Text)).join('')
  }

  return ''
}

function extractMermaidSource(codeElement: Element): string {
  return codeElement.children
    .map((child) => extractTextFromNode(child as Element | Text))
    .join('')
    .trim()
}

export function rehypeMermaid() {
  return function (tree: Root): void {
    visit(
      tree,
      'element',
      (node: Element, index: number | undefined, parent: Element | Root | undefined) => {
        if (!isMermaidCodeBlock(node)) return

        const codeElement = node.children[0] as Element
        const mermaidSource = extractMermaidSource(codeElement)

        if (!mermaidSource) return

        const mermaidContainer = h('div', {
          class: 'mermaid-container',
          'data-mermaid': 'true',
          'data-code': mermaidSource,
        })

        if (parent && index !== undefined) {
          parent.children[index] = mermaidContainer
        }
      },
    )
  }
}
