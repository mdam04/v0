export function extractSelectors(content: string): string[] {
  const selectors: string[] = []

  try {
    // Extract IDs
    const idRegex = /id=(?:{[^}]*}|"([^"]+)"|'([^']+)')/g
    let idMatch
    while ((idMatch = idRegex.exec(content)) !== null) {
      const id = idMatch[1] || idMatch[2]
      if (id && !id.includes("{")) {
        selectors.push(`#${id}`)
      }
    }

    // Extract class names
    const classRegex = /className=(?:{[^}]*}|"([^"]+)"|'([^']+)')/g
    let classMatch
    while ((classMatch = classRegex.exec(content)) !== null) {
      const className = classMatch[1] || classMatch[2]
      if (className && !className.includes("{")) {
        const classes = className.split(" ").filter((c) => c.trim())
        classes.forEach((cls) => {
          if (!cls.includes("${") && !cls.includes("`")) {
            selectors.push(`.${cls}`)
          }
        })
      }
    }

    // Extract data-testid attributes
    const testIdRegex = /data-testid=(?:{[^}]*}|"([^"]+)"|'([^']+)')/g
    let testIdMatch
    while ((testIdMatch = testIdRegex.exec(content)) !== null) {
      const testId = testIdMatch[1] || testIdMatch[2]
      if (testId && !testId.includes("{")) {
        selectors.push(`[data-testid="${testId}"]`)
      }
    }

    // Extract form elements
    const formElementRegex = /<(input|button|select|textarea)[^>]*>/gi
    let formMatch
    while ((formMatch = formElementRegex.exec(content)) !== null) {
      const element = formMatch[0]
      const tagName = formMatch[1].toLowerCase()

      // Try to get specific selectors for form elements
      const nameMatch = element.match(/name=["']([^"']+)["']/)
      const typeMatch = element.match(/type=["']([^"']+)["']/)

      if (nameMatch) {
        selectors.push(`[name="${nameMatch[1]}"]`)
      }

      if (typeMatch && tagName === "input") {
        selectors.push(`input[type="${typeMatch[1]}"]`)
      }

      if (tagName === "button") {
        selectors.push("button")
      }
    }

    // Extract role attributes
    const roleRegex = /role=["']([^"']+)["']/g
    let roleMatch
    while ((roleMatch = roleRegex.exec(content)) !== null) {
      const role = roleMatch[1]
      selectors.push(`[role="${role}"]`)
    }

    // Extract aria-label attributes
    const ariaLabelRegex = /aria-label=["']([^"']+)["']/g
    let ariaMatch
    while ((ariaMatch = ariaLabelRegex.exec(content)) !== null) {
      const label = ariaMatch[1]
      selectors.push(`[aria-label="${label}"]`)
    }
  } catch (error) {
    console.error("Error extracting selectors:", error)
  }

  // Remove duplicates and return
  return [...new Set(selectors)]
}
