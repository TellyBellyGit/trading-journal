import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { Color } from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import { FontFamily } from '@tiptap/extension-font-family'
import { Underline } from '@tiptap/extension-underline'
import { Image } from '@tiptap/extension-image'

let editor

// Initialize the editor
function initEditor() {
    editor = new Editor({
        element: document.querySelector('#editor'),
        extensions: [
            StarterKit,
            Color,
            TextStyle,
            FontFamily.configure({
                types: ['textStyle'],
            }),
            Underline,
            Image.configure({
                inline: true,
                allowBase64: true,
                HTMLAttributes: {
                    style: 'max-width: 100%; height: auto;',
                },
            }),
        ],
        content: '<p>Start typing or load test HTML content...</p>',
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
            },
        },
        onUpdate: ({ editor }) => {
            // Auto-save simulation - debounced HTML output
            debounce(() => {
                updateHTMLOutput()
            }, 500)()
        },
    })
}

// Debounce function for auto-save
function debounce(func, wait) {
    let timeout
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout)
            func(...args)
        }
        clearTimeout(timeout)
        timeout = setTimeout(later, wait)
    }
}

// Update HTML output display
function updateHTMLOutput() {
    if (editor) {
        const html = editor.getHTML()
        document.getElementById('html-output').textContent = html
    }
}

// Setup toolbar event listeners
function setupToolbar() {
    // Bold
    document.getElementById('bold-btn').addEventListener('click', () => {
        editor.chain().focus().toggleBold().run()
    })
    
    // Italic
    document.getElementById('italic-btn').addEventListener('click', () => {
        editor.chain().focus().toggleItalic().run()
    })
    
    // Underline
    document.getElementById('underline-btn').addEventListener('click', () => {
        editor.chain().focus().toggleUnderline().run()
    })
    
    // Undo
    document.getElementById('undo-btn').addEventListener('click', () => {
        editor.chain().focus().undo().run()
    })
    
    // Redo
    document.getElementById('redo-btn').addEventListener('click', () => {
        editor.chain().focus().redo().run()
    })
    
    // Font Family
    document.getElementById('font-family').addEventListener('change', (e) => {
        if (e.target.value) {
            editor.chain().focus().setFontFamily(e.target.value).run()
        } else {
            editor.chain().focus().unsetFontFamily().run()
        }
    })
    
    // Font Size (using style attribute since Tiptap doesn't have built-in font size)
    document.getElementById('font-size').addEventListener('change', (e) => {
        if (e.target.value) {
            editor.chain().focus().setMark('textStyle', { fontSize: e.target.value }).run()
        } else {
            editor.chain().focus().unsetMark('textStyle').run()
        }
    })
    
    // Text Color
    document.getElementById('text-color').addEventListener('change', (e) => {
        editor.chain().focus().setColor(e.target.value).run()
    })
    
    // Load Test HTML
    document.getElementById('load-test-html').addEventListener('click', () => {
        const testHTML = document.getElementById('test-html').innerHTML
        editor.commands.setContent(testHTML)
        updateHTMLOutput()
    })
    
    // Get HTML
    document.getElementById('get-html').addEventListener('click', () => {
        updateHTMLOutput()
        console.log('Current HTML:', editor.getHTML())
    })
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initEditor()
    setupToolbar()
    updateHTMLOutput()
})

// Handle image paste
document.addEventListener('paste', (event) => {
    const items = event.clipboardData.items
    
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile()
            const reader = new FileReader()
            
            reader.onload = (e) => {
                const img = document.createElement('img')
                img.src = e.target.result
                img.style.maxWidth = '300px'
                img.style.height = 'auto'
                img.style.resize = 'both'
                img.style.overflow = 'auto'
                
                // Insert image into editor
                editor.chain().focus().setImage({ src: e.target.result }).run()
            }
            
            reader.readAsDataURL(file)
        }
    }
})