export interface ComponentData {
  name: string
  components: string[]
  imports: string[]
  exports: string[]
  hooks: string[]
  props: string[]
}

export function parseComponent(content: string): ComponentData {
  const componentData: ComponentData = {
    name: "",
    components: [],
    imports: [],
    exports: [],
    hooks: [],
    props: [],
  }

  try {
    // Extract imports
    const importRegex = /import\s+(?:{[^}]*}|\*\s+as\s+\w+|\w+)?\s*(?:,\s*{[^}]*})?\s*from\s+['"][^'"]+['"]/g
    const imports = content.match(importRegex) || []
    componentData.imports = imports

    // Extract component names from imports
    imports.forEach((imp) => {
      const componentMatch = imp.match(/import\s+{([^}]+)}\s+from/)
      if (componentMatch) {
        const components = componentMatch[1].split(",").map((c) => c.trim())
        componentData.components.push(...components)
      }
    })

    // Extract default export component name
    const defaultExportMatch = content.match(/export\s+default\s+(?:function\s+)?(\w+)/)
    if (defaultExportMatch) {
      componentData.name = defaultExportMatch[1]
    }

    // Extract named exports
    const namedExportRegex = /export\s+(?:const|function|class)\s+(\w+)/g
    let namedExportMatch
    while ((namedExportMatch = namedExportRegex.exec(content)) !== null) {
      componentData.exports.push(namedExportMatch[1])
    }

    // Extract React hooks
    const hookRegex = /use\w+\(/g
    const hooks = content.match(hookRegex) || []
    componentData.hooks = [...new Set(hooks.map((hook) => hook.replace("(", "")))]

    // Extract props interface/type
    const propsMatch = content.match(/interface\s+\w*Props\s*{([^}]+)}/s)
    if (propsMatch) {
      const propsContent = propsMatch[1]
      const propNames = propsContent.match(/(\w+)(?:\?)?:/g) || []
      componentData.props = propNames.map((prop) => prop.replace(/[?:]/g, ""))
    }
  } catch (error) {
    console.error("Error parsing component:", error)
  }

  return componentData
}
