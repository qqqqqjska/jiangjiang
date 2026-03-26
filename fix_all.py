import os
import re

def fix_css():
    with open('style.css', 'r', encoding='utf-8') as f:
        css = f.read()

    # Add missing heights and border radius to tiw-image
    if '.tiw-image {' in css:
        css = re.sub(r'(\.tiw-image\s*\{[^}]*background-position:\s*center;)', r'\1 height: 100px; border-radius: 12px; margin-top: 10px;', css)

    # Beautify UI Redesign - Premium White/Gray & Artistic Fonts
    beautify_css = """
/* Aesthetic Beautify UI Redesign */
#beautify-page {
    background: #f8f9fa;
    color: #333;
    font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif;
}

.beautify-header {
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(0,0,0,0.05);
}

.beautify-header h2 {
    font-family: 'Times New Roman', Times, serif;
    font-style: italic;
    font-weight: 400;
    color: #111;
    font-size: 22px;
}

.beautify-section {
    background: #fff;
    border-radius: 20px;
    padding: 25px;
    margin-bottom: 20px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.03);
    border: 1px solid rgba(0,0,0,0.02);
}

.section-title {
    font-family: 'Times New Roman', Times, serif;
    font-style: italic;
    font-size: 24px;
    color: #111;
    margin-bottom: 20px;
    display: flex;
    flex-direction: column;
}

.section-title .section-subtitle {
    font-family: -apple-system, sans-serif;
    font-style: normal;
    font-size: 12px;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-top: 4px;
}

/* App Icon Layout: Vertical Left, Preview Right */
.app-customizer-container {
    display: flex;
    gap: 20px;
    height: 300px;
}

.app-list-sidebar {
    width: 40%;
    display: flex;
    flex-direction: column;
    gap: 8px;
    overflow-y: auto;
    padding-right: 10px;
    border-right: 1px solid #eaeaea;
}

.app-nav-item {
    padding: 12px 15px;
    border-radius: 12px;
    background: transparent;
    color: #555;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
}

.app-nav-item.active {
    background: #111;
    color: #fff;
    font-weight: 500;
}

.app-editor-area {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
}

.app-editor-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
    width: 100%;
}

.app-icon-preview-large {
    width: 80px;
    height: 80px;
    border-radius: 20px;
    background: #f0f0f0;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 32px;
    color: #aaa;
    cursor: pointer;
    background-size: cover;
    background-position: center;
    box-shadow: 0 10px 20px rgba(0,0,0,0.05);
    transition: transform 0.2s;
}

.app-icon-preview-large:hover {
    transform: translateY(-2px);
}

.app-name-edit-input {
    width: 100%;
    text-align: center;
    border: none;
    background: #f8f9fa;
    padding: 10px;
    border-radius: 10px;
    font-size: 14px;
    outline: none;
}

/* Wallpaper Scrollable Gallery */
.wallpaper-carousel-container {
    overflow-x: auto;
    padding-bottom: 15px;
    /* Hide scrollbar */
    scrollbar-width: none;
}
.wallpaper-carousel-container::-webkit-scrollbar {
    display: none;
}

.wallpaper-carousel {
    display: flex;
    gap: 15px;
    padding: 10px 5px;
}

.wallpaper-card {
    min-width: 120px;
    height: 220px;
    border-radius: 16px;
    background-size: cover;
    background-position: center;
    background-color: #f0f0f0;
    cursor: pointer;
    box-shadow: 0 8px 20px rgba(0,0,0,0.08);
    transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
    position: relative;
    border: 2px solid transparent;
}

.wallpaper-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 15px 30px rgba(0,0,0,0.15);
}

.wallpaper-card.active {
    border-color: #111;
    transform: translateY(-5px);
}

.add-wallpaper-card {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background: #fff;
    border: 1px dashed #ccc;
    color: #888;
    box-shadow: none;
}
.add-wallpaper-card i {
    font-size: 28px;
    margin-bottom: 8px;
}

/* Buttons and Inputs */
.premium-btn {
    background: #111;
    color: #fff;
    border: none;
    padding: 12px 20px;
    border-radius: 12px;
    font-size: 14px;
    cursor: pointer;
    transition: opacity 0.2s;
}

.premium-btn:hover {
    opacity: 0.8;
}

.premium-upload-btn {
    background: #fff;
    color: #111;
    border: 1px solid #eaeaea;
    box-shadow: 0 4px 10px rgba(0,0,0,0.02);
}

.font-settings-card {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.font-input-group label {
    font-size: 12px;
    color: #888;
    margin-bottom: 6px;
    display: block;
}

.font-input-group input {
    width: 100%;
    border: 1px solid #eaeaea;
    padding: 12px 15px;
    border-radius: 12px;
    background: #fdfdfd;
    outline: none;
    font-size: 14px;
    transition: border-color 0.2s;
}

.font-input-group input:focus {
    border-color: #111;
}
"""

    # If it's already there, replace it, else append
    if '/* Aesthetic Beautify UI Redesign */' in css:
        css = re.sub(r'/\* Aesthetic Beautify UI Redesign \*/.*', beautify_css, css, flags=re.DOTALL)
    else:
        css += beautify_css
    
    with open('style.css', 'w', encoding='utf-8') as f:
        f.write(css)

def fix_html():
    with open('index.html', 'r', encoding='utf-8') as f:
        html = f.read()

    # Moments Feed Page -> Chat View Moments Tab mapping
    # Move the moments feed into the chat-content-area
    if 'id="moments-feed-page"' in html and 'id="chat-view-moments"' not in html:
        # Extract moments-feed-page
        match = re.search(r'<div id="moments-feed-page".*?<!-- 评论输入栏 -->.*?</div>\s*</div>', html, re.DOTALL)
        if match:
            moments_html = match.group(0)
            html = html.replace(moments_html, '')
            
            # Modify moments_html to be a chat-view-panel
            moments_html = moments_html.replace('id="moments-feed-page"', 'id="chat-view-moments" class="chat-view-panel"')
            # Change the fixed header positioning for tab mode if needed
            
            # Inject into chat-content-area
            insert_pos = html.find('<div id="chat-view-mine"')
            if insert_pos != -1:
                html = html[:insert_pos] + moments_html + '\n            ' + html[insert_pos:]
                
    # Update tiw-image structure in index.html for correct square layout
    # if it's not already having height/border radius properly nested
    
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)

def fix_js():
    with open('APP.js', 'r', encoding='utf-8') as f:
        js = f.read()

    # Move newImageTargets inside DOMContentLoaded to ensure proper initialization
    if '// --- NEW UI IMAGE UPLOADS ---' in js:
        # We need to make sure the event listeners are attached properly.
        # Actually they are already attached. The issue is usually that the targets don't have visual size.
        pass

    # Ensure font saving logic is robust
    if 'applyAndSaveFont' in js:
        js = js.replace("localStorage.setItem('customFontDataUrl', dataUrl || '');", "localStorage.setItem('customFontDataUrl', dataUrl || '');\n        alert('Font saved successfully!');")

    with open('APP.js', 'w', encoding='utf-8') as f:
        f.write(js)

if __name__ == '__main__':
    fix_css()
    fix_html()
    fix_js()
    print("UI and bug fixes applied successfully.")
