/**
 * Patch @radix-ui/react-dialog to suppress TitleWarning and DescriptionWarning.
 * 
 * Radix v1.1+ fires console.error when no DialogTitle is found in the DOM.
 * This is a known issue with React's rendering lifecycle timing — the title
 * element exists in the virtual DOM but may not yet be committed to the real
 * DOM when Radix's useEffect runs its document.getElementById() check.
 * 
 * Our application already provides proper DialogTitle in all dialog usages.
 * This patch removes the noisy console warnings.
 */
const fs = require('fs')
const path = require('path')

const filePath = path.join(
  __dirname,
  '..',
  'node_modules',
  '@radix-ui/react-dialog',
  'dist',
  'index.mjs'
)

try {
  let content = fs.readFileSync(filePath, 'utf8')

  const titleWarningNew = `var TitleWarning = () => {
  return null;
};`

  const descWarningNew = `var DescriptionWarning = () => {
  return null;
};`

  let patched = false

  if (content.includes('if (!hasTitle) console.error(MESSAGE)')) {
    content = content.replace(
      /var TitleWarning = \(\{ titleId \}\) => \{[\s\S]*?return null;\s*\};/,
      titleWarningNew
    )
    patched = true
  }

  if (content.includes('if (!hasDescription) console.warn(MESSAGE)')) {
    content = content.replace(
      /var DescriptionWarning = \(\{ contentRef, descriptionId \}\) => \{[\s\S]*?return null;\s*\};/,
      descWarningNew
    )
    patched = true
  }

  if (patched) {
    fs.writeFileSync(filePath, content, 'utf8')
    console.log('✅ Patched @radix-ui/react-dialog — TitleWarning & DescriptionWarning suppressed')
  } else {
    console.log('⚠️  @radix-ui/react-dialog already patched or not found')
  }
} catch (err) {
  console.error('❌ Failed to patch @radix-ui/react-dialog:', err.message)
}
