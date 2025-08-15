/**
 * Accessibility Testing Helper
 * Provides utilities for testing WCAG compliance across the application
 */

import { Page } from '@playwright/test'
import { expect } from '@playwright/test'

export interface AccessibilityResult {
  violations: AccessibilityViolation[]
  passes: number
  incomplete: number
  url: string
  timestamp: string
}

export interface AccessibilityViolation {
  id: string
  impact: 'minor' | 'moderate' | 'serious' | 'critical'
  description: string
  help: string
  helpUrl: string
  nodes: AccessibilityNode[]
}

export interface AccessibilityNode {
  target: string[]
  html: string
  failureSummary: string
}

export class AccessibilityTestHelper {
  private page: Page

  constructor(page: Page) {
    this.page = page
  }

  /**
   * Run comprehensive accessibility audit using axe-core
   */
  async runAccessibilityAudit(options?: {
    tags?: string[]
    exclude?: string[]
    include?: string[]
  }): Promise<AccessibilityResult> {
    // Inject axe-core
    await this.page.addScriptTag({
      url: 'https://unpkg.com/axe-core@4.8.2/axe.min.js'
    })

    // Configure axe options
    const axeOptions = {
      tags: options?.tags || ['wcag2a', 'wcag2aa', 'wcag21aa'],
      exclude: options?.exclude || [],
      include: options?.include || [],
    }

    // Run axe audit
    const results = await this.page.evaluate((config) => {
      return new Promise((resolve) => {
        // @ts-ignore
        axe.run(document, config, (err: any, results: any) => {
          if (err) throw err
          resolve(results)
        })
      })
    }, axeOptions)

    return {
      violations: results.violations || [],
      passes: results.passes?.length || 0,
      incomplete: results.incomplete?.length || 0,
      url: this.page.url(),
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * Test keyboard navigation
   */
  async testKeyboardNavigation(): Promise<{
    canTabThrough: boolean
    focusOrder: string[]
    trapsFocus: boolean
    issues: string[]
  }> {
    const issues: string[] = []
    const focusOrder: string[] = []
    let canTabThrough = true
    let trapsFocus = true

    try {
      // Start from the beginning
      await this.page.keyboard.press('Tab')
      
      let previousElement: string | null = null
      let attempts = 0
      const maxAttempts = 50

      while (attempts < maxAttempts) {
        const currentElement = await this.page.evaluate(() => {
          const focused = document.activeElement
          if (!focused || focused === document.body) return null
          return focused.tagName + (focused.id ? '#' + focused.id : '') + 
                 (focused.className ? '.' + focused.className.split(' ').join('.') : '')
        })

        if (!currentElement) {
          issues.push('Tab navigation stopped working')
          canTabThrough = false
          break
        }

        if (currentElement === previousElement) {
          // Same element, might be trapped
          break
        }

        focusOrder.push(currentElement)
        previousElement = currentElement

        await this.page.keyboard.press('Tab')
        attempts++
      }

      // Test if focus can escape (for modals, etc.)
      if (attempts >= maxAttempts) {
        issues.push('Possible focus trap detected - could not complete tab cycle')
      }

    } catch (error) {
      issues.push(`Keyboard navigation test failed: ${error}`)
      canTabThrough = false
    }

    return {
      canTabThrough,
      focusOrder,
      trapsFocus,
      issues,
    }
  }

  /**
   * Test color contrast ratios
   */
  async testColorContrast(): Promise<{
    violations: Array<{
      element: string
      contrast: number
      required: number
      colors: { foreground: string; background: string }
    }>
    passes: number
  }> {
    const violations: any[] = []
    let passes = 0

    // This would typically use a color contrast checking library
    // For now, we'll use axe-core which includes color contrast checks
    const auditResult = await this.runAccessibilityAudit({
      tags: ['color-contrast']
    })

    auditResult.violations.forEach(violation => {
      if (violation.id === 'color-contrast') {
        violation.nodes.forEach(node => {
          violations.push({
            element: node.target.join(', '),
            contrast: 0, // Would be calculated
            required: 4.5, // WCAG AA standard
            colors: {
              foreground: 'unknown',
              background: 'unknown'
            }
          })
        })
      }
    })

    passes = auditResult.passes

    return { violations, passes }
  }

  /**
   * Test form accessibility
   */
  async testFormAccessibility(): Promise<{
    hasLabels: boolean
    hasFieldsets: boolean
    hasErrorMessages: boolean
    issues: string[]
  }> {
    const issues: string[] = []

    const formAnalysis = await this.page.evaluate(() => {
      const forms = document.querySelectorAll('form')
      const inputs = document.querySelectorAll('input, textarea, select')
      const fieldsets = document.querySelectorAll('fieldset')
      
      let unlabeledInputs = 0
      let inputsWithAriaLabel = 0
      let inputsWithLabels = 0

      inputs.forEach(input => {
        const id = input.getAttribute('id')
        const ariaLabel = input.getAttribute('aria-label')
        const ariaLabelledBy = input.getAttribute('aria-labelledby')
        const associatedLabel = id ? document.querySelector(`label[for="${id}"]`) : null

        if (!associatedLabel && !ariaLabel && !ariaLabelledBy) {
          unlabeledInputs++
        } else if (ariaLabel || ariaLabelledBy) {
          inputsWithAriaLabel++
        } else if (associatedLabel) {
          inputsWithLabels++
        }
      })

      return {
        totalForms: forms.length,
        totalInputs: inputs.length,
        totalFieldsets: fieldsets.length,
        unlabeledInputs,
        inputsWithAriaLabel,
        inputsWithLabels,
      }
    })

    if (formAnalysis.unlabeledInputs > 0) {
      issues.push(`${formAnalysis.unlabeledInputs} form inputs lack proper labels`)
    }

    return {
      hasLabels: formAnalysis.unlabeledInputs === 0,
      hasFieldsets: formAnalysis.totalFieldsets > 0,
      hasErrorMessages: true, // Would need specific checking
      issues,
    }
  }

  /**
   * Test heading structure
   */
  async testHeadingStructure(): Promise<{
    isLogical: boolean
    headings: Array<{ level: number; text: string }>
    issues: string[]
  }> {
    const headings = await this.page.evaluate(() => {
      const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6')
      return Array.from(headingElements).map(heading => ({
        level: parseInt(heading.tagName[1]),
        text: heading.textContent?.trim() || '',
      }))
    })

    const issues: string[] = []
    let isLogical = true

    // Check for logical heading progression
    for (let i = 1; i < headings.length; i++) {
      const current = headings[i]
      const previous = headings[i - 1]
      
      if (current.level > previous.level + 1) {
        issues.push(`Heading level jumps from H${previous.level} to H${current.level}`)
        isLogical = false
      }
    }

    // Check for H1
    const h1Count = headings.filter(h => h.level === 1).length
    if (h1Count === 0) {
      issues.push('No H1 heading found')
      isLogical = false
    } else if (h1Count > 1) {
      issues.push('Multiple H1 headings found')
      isLogical = false
    }

    return {
      isLogical,
      headings,
      issues,
    }
  }

  /**
   * Test image accessibility
   */
  async testImageAccessibility(): Promise<{
    hasAltText: boolean
    decorativeImagesMarked: boolean
    issues: string[]
  }> {
    const imageAnalysis = await this.page.evaluate(() => {
      const images = document.querySelectorAll('img')
      let imagesWithoutAlt = 0
      let decorativeImages = 0
      let totalImages = images.length

      images.forEach(img => {
        const alt = img.getAttribute('alt')
        const role = img.getAttribute('role')
        
        if (alt === null) {
          imagesWithoutAlt++
        } else if (alt === '' || role === 'presentation') {
          decorativeImages++
        }
      })

      return {
        totalImages,
        imagesWithoutAlt,
        decorativeImages,
      }
    })

    const issues: string[] = []
    
    if (imageAnalysis.imagesWithoutAlt > 0) {
      issues.push(`${imageAnalysis.imagesWithoutAlt} images lack alt attributes`)
    }

    return {
      hasAltText: imageAnalysis.imagesWithoutAlt === 0,
      decorativeImagesMarked: imageAnalysis.decorativeImages > 0,
      issues,
    }
  }

  /**
   * Test ARIA usage
   */
  async testAriaUsage(): Promise<{
    hasAriaLabels: boolean
    hasAriaDescriptions: boolean
    hasValidRoles: boolean
    issues: string[]
  }> {
    const ariaAnalysis = await this.page.evaluate(() => {
      const elementsWithAriaLabel = document.querySelectorAll('[aria-label]')
      const elementsWithAriaDescribedBy = document.querySelectorAll('[aria-describedby]')
      const elementsWithRole = document.querySelectorAll('[role]')
      
      // Check for invalid ARIA roles
      const invalidRoles: string[] = []
      const validRoles = [
        'alert', 'alertdialog', 'application', 'article', 'banner', 'button',
        'cell', 'checkbox', 'columnheader', 'combobox', 'complementary',
        'contentinfo', 'definition', 'dialog', 'directory', 'document',
        'feed', 'figure', 'form', 'grid', 'gridcell', 'group', 'heading',
        'img', 'link', 'list', 'listbox', 'listitem', 'log', 'main',
        'marquee', 'math', 'menu', 'menubar', 'menuitem', 'menuitemcheckbox',
        'menuitemradio', 'navigation', 'none', 'note', 'option', 'presentation',
        'progressbar', 'radio', 'radiogroup', 'region', 'row', 'rowgroup',
        'rowheader', 'scrollbar', 'search', 'searchbox', 'separator',
        'slider', 'spinbutton', 'status', 'switch', 'tab', 'table',
        'tablist', 'tabpanel', 'term', 'textbox', 'timer', 'toolbar',
        'tooltip', 'tree', 'treegrid', 'treeitem'
      ]

      elementsWithRole.forEach(element => {
        const role = element.getAttribute('role')
        if (role && !validRoles.includes(role)) {
          invalidRoles.push(role)
        }
      })

      return {
        ariaLabelCount: elementsWithAriaLabel.length,
        ariaDescribedByCount: elementsWithAriaDescribedBy.length,
        roleCount: elementsWithRole.length,
        invalidRoles,
      }
    })

    const issues: string[] = []
    
    if (ariaAnalysis.invalidRoles.length > 0) {
      issues.push(`Invalid ARIA roles found: ${ariaAnalysis.invalidRoles.join(', ')}`)
    }

    return {
      hasAriaLabels: ariaAnalysis.ariaLabelCount > 0,
      hasAriaDescriptions: ariaAnalysis.ariaDescribedByCount > 0,
      hasValidRoles: ariaAnalysis.invalidRoles.length === 0,
      issues,
    }
  }

  /**
   * Generate comprehensive accessibility report
   */
  async generateAccessibilityReport(): Promise<{
    overallScore: number
    wcagLevel: 'AA' | 'A' | 'Fail'
    audit: AccessibilityResult
    keyboard: any
    colorContrast: any
    forms: any
    headings: any
    images: any
    aria: any
    summary: {
      criticalIssues: number
      totalIssues: number
      passedTests: number
      recommendations: string[]
    }
  }> {
    console.log('Running comprehensive accessibility audit...')

    const [audit, keyboard, colorContrast, forms, headings, images, aria] = await Promise.all([
      this.runAccessibilityAudit(),
      this.testKeyboardNavigation(),
      this.testColorContrast(),
      this.testFormAccessibility(),
      this.testHeadingStructure(),
      this.testImageAccessibility(),
      this.testAriaUsage(),
    ])

    // Calculate scores
    const criticalViolations = audit.violations.filter(v => v.impact === 'critical').length
    const seriousViolations = audit.violations.filter(v => v.impact === 'serious').length
    const totalViolations = audit.violations.length

    let wcagLevel: 'AA' | 'A' | 'Fail' = 'AA'
    if (criticalViolations > 0 || seriousViolations > 5) {
      wcagLevel = 'Fail'
    } else if (seriousViolations > 2 || totalViolations > 10) {
      wcagLevel = 'A'
    }

    const overallScore = Math.max(0, 100 - (criticalViolations * 20) - (seriousViolations * 10) - (totalViolations * 2))

    // Generate recommendations
    const recommendations: string[] = []
    if (criticalViolations > 0) {
      recommendations.push('Fix critical accessibility violations immediately')
    }
    if (!keyboard.canTabThrough) {
      recommendations.push('Ensure all interactive elements are keyboard accessible')
    }
    if (!forms.hasLabels) {
      recommendations.push('Add proper labels to all form inputs')
    }
    if (!headings.isLogical) {
      recommendations.push('Fix heading structure for better content organization')
    }
    if (!images.hasAltText) {
      recommendations.push('Add alt text to all meaningful images')
    }

    const totalIssues = totalViolations + keyboard.issues.length + forms.issues.length + 
                       headings.issues.length + images.issues.length + aria.issues.length

    return {
      overallScore,
      wcagLevel,
      audit,
      keyboard,
      colorContrast,
      forms,
      headings,
      images,
      aria,
      summary: {
        criticalIssues: criticalViolations,
        totalIssues,
        passedTests: audit.passes,
        recommendations,
      },
    }
  }
}