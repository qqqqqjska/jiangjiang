import re

def update_index_html():
    with open('index.html', 'r', encoding='utf-8') as f:
        html = f.read()

    new_home_screen = """<div id="home-screen-page">
        <div class="home-swiper">
            <!-- Page 1 -->
            <div class="home-page" id="home-page-1">
                <div class="capsule-widget" id="capsule-widget-bg">
                    <label for="upload-capsule-bg" class="capsule-bg-btn"><i class='bx bx-image-add'></i></label>
                    <div class="capsule-content">
                        <div class="capsule-left">
                            <label for="upload-capsule-avatar">
                                <div class="capsule-avatar" id="image-target-capsule-avatar"></div>
                            </label>
                            <div class="capsule-motto-area">
                                <span class="capsule-motto" contenteditable="true">Love U</span>
                                <span class="capsule-date" contenteditable="true">03月21日 星期六</span>
                            </div>
                        </div>
                        <div class="capsule-right">
                            <div class="capsule-top-right">
                                <span class="capsule-battery-text">Battery 100%</span>
                            </div>
                            <div id="capsule-time" class="capsule-time">10:00</div>
                        </div>
                    </div>
                </div>

                <div class="middle-row">
                    <div class="left-col">
                        <label for="upload-small-rounded">
                            <div class="small-rounded-widget" id="image-target-small-rounded">
                                <i class='bx bx-plus empty-icon'></i>
                            </div>
                        </label>
                    </div>
                    <div class="right-col">
                        <label for="upload-polaroid-1">
                            <div class="polaroid-widget" id="image-target-polaroid-1">
                                <div class="polaroid-inner"></div>
                                <div class="polaroid-text" contenteditable="true">Top Widgets+</div>
                            </div>
                        </label>
                    </div>
                </div>

                <div class="bottom-row">
                    <div class="left-col">
                        <label for="upload-original-square">
                            <div class="original-square-widget" id="image-target-original-square">
                                <i class='bx bx-plus empty-icon'></i>
                            </div>
                        </label>
                    </div>
                    <div class="right-col">
                        <div class="app-grid-2x2">
                            <div class="icon-customizable" id="app-item-1"><i class='bx bx-chat'></i><span>聊天</span></div>
                            <div class="icon-customizable" id="app-item-2"><i class='bx bx-book'></i><span>世界书</span></div>
                            <div class="icon-customizable" id="app-item-3"><i class='bx bx-heart'></i><span>情侣空间</span></div>
                            <div class="icon-customizable" id="app-item-4"><i class='bx bxs-pen'></i><span>作家协会</span></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Page 2 -->
            <div class="home-page" id="home-page-2">
                <div class="polaroid-row-widget">
                    <label for="upload-polaroid-row-1" class="mini-polaroid" id="image-target-polaroid-row-1">
                        <div class="tape"></div>
                    </label>
                    <label for="upload-polaroid-row-2" class="mini-polaroid" id="image-target-polaroid-row-2">
                        <div class="tape"></div>
                    </label>
                    <label for="upload-polaroid-row-3" class="mini-polaroid" id="image-target-polaroid-row-3">
                        <div class="tape"></div>
                    </label>
                </div>

                <div class="page-2-bottom">
                    <div class="left-col">
                        <div class="app-grid-2x2">
                            <div class="icon-customizable" id="app-item-5"><i class='bx bx-star'></i><span>星星系统</span></div>
                            <div class="icon-customizable" id="app-item-6"><i class='bx bx-ghost'></i><span>占位1</span></div>
                            <div class="icon-customizable" id="app-item-7"><i class='bx bx-planet'></i><span>占位2</span></div>
                            <div class="icon-customizable" id="app-item-8"><i class='bx bx-music'></i><span>占位3</span></div>
                        </div>
                    </div>
                    <div class="right-col">
                        <label for="upload-large-rounded">
                            <div class="large-rounded-widget" id="image-target-large-rounded">
                                <i class='bx bx-plus empty-icon'></i>
                            </div>
                        </label>
                    </div>
                </div>
            </div>
        </div>

        <div class="floating-dock glass-widget">
            <div class="icon-customizable" id="nav-item-1"><i class='bx bx-palette'></i><span>美化</span></div>
            <div class="icon-customizable" id="nav-item-2"><i class='bx bx-cog'></i><span>设置</span></div>
            <div class="icon-customizable" id="nav-item-3"><i class='bx bx-search-alt-2'></i><span>查手机</span></div>
        </div>
    </div>"""

    # Replace the home screen section
    pattern = re.compile(r'<div id="home-screen-page">.*?</div>\s*<div id="chat-app-page">', re.DOTALL)
    if not pattern.search(html):
        print("Could not find <div id=\"home-screen-page\">...<div id=\"chat-app-page\">")
        return
        
    html = pattern.sub(new_home_screen + '\n\n    <div id="chat-app-page">', html)

    # Add hidden file inputs
    hidden_inputs = """
    <input type="file" class="hidden-file-input" id="upload-capsule-bg" accept="image/*">
    <input type="file" class="hidden-file-input" id="upload-capsule-avatar" accept="image/*">
    <input type="file" class="hidden-file-input" id="upload-small-rounded" accept="image/*">
    <input type="file" class="hidden-file-input" id="upload-polaroid-1" accept="image/*">
    <input type="file" class="hidden-file-input" id="upload-original-square" accept="image/*">
    <input type="file" class="hidden-file-input" id="upload-polaroid-row-1" accept="image/*">
    <input type="file" class="hidden-file-input" id="upload-polaroid-row-2" accept="image/*">
    <input type="file" class="hidden-file-input" id="upload-polaroid-row-3" accept="image/*">
    <input type="file" class="hidden-file-input" id="upload-large-rounded" accept="image/*">
</div>"""
    
    html = html.replace('</div>\n\n<audio id="keep-alive-audio"', hidden_inputs + '\n\n<audio id="keep-alive-audio"')

    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("index.html updated successfully.")

def update_css():
    with open('style.css', 'a', encoding='utf-8') as f:
        f.write('''
/* --- NEW UI STYLES --- */
#home-screen-page {
    position: relative;
    height: 100%;
    width: 100%;
    overflow: hidden;
    background: transparent;
}

.home-swiper {
    display: flex;
    width: 100%;
    height: 100%;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;
    -ms-overflow-style: none;
}
.home-swiper::-webkit-scrollbar {
    display: none;
}

.home-page {
    flex: 0 0 100%;
    width: 100%;
    height: 100%;
    scroll-snap-align: start;
    padding: 20px 15px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 15px;
    padding-bottom: 100px; /* Space for dock */
}

/* Capsule Widget (Top) */
.capsule-widget {
    background: #fff;
    border-radius: 40px;
    padding: 15px 20px;
    position: relative;
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    background-size: cover;
    background-position: center;
    overflow: hidden;
}
.capsule-bg-btn {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 2;
    background: rgba(0,0,0,0.3);
    color: #fff;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
}
.capsule-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
    z-index: 1;
}
.capsule-left {
    display: flex;
    align-items: center;
    gap: 12px;
}
.capsule-avatar {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background-color: #000;
    background-size: cover;
    background-position: center;
    cursor: pointer;
}
.capsule-motto-area {
    display: flex;
    flex-direction: column;
}
.capsule-motto {
    font-size: 14px;
    font-weight: 700;
    color: #000;
}
.capsule-date {
    font-size: 10px;
    color: #555;
    margin-top: 2px;
}
.capsule-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
}
.capsule-top-right {
    background: #000;
    color: #fff;
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 10px;
    font-weight: bold;
    margin-bottom: 5px;
}
.capsule-time {
    font-size: 28px;
    font-weight: 900;
    color: #000;
    letter-spacing: -1px;
}

/* Middle & Bottom Rows */
.middle-row, .bottom-row, .page-2-bottom {
    display: flex;
    gap: 15px;
    height: 160px;
}
.left-col, .right-col {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
}

/* Small Rounded Widget */
.small-rounded-widget, .original-square-widget {
    width: 100%;
    height: 100%;
    background: rgba(255,255,255,0.3);
    backdrop-filter: blur(10px);
    border-radius: 24px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.05);
    background-size: cover;
    background-position: center;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
}
.original-square-widget {
    border-radius: 30px;
}

/* Polaroid Widget */
.polaroid-widget {
    width: 100%;
    height: 100%;
    background: #fff;
    padding: 8px 8px 30px 8px;
    box-sizing: border-box;
    box-shadow: 2px 4px 15px rgba(0,0,0,0.15);
    transform: rotate(3deg);
    position: relative;
    cursor: pointer;
    display: flex;
    flex-direction: column;
}
.polaroid-inner {
    flex: 1;
    background: #f0f0f0;
    background-size: cover;
    background-position: center;
}
.polaroid-text {
    position: absolute;
    bottom: 8px;
    width: 100%;
    text-align: center;
    left: 0;
    font-size: 12px;
    color: #333;
    font-family: 'Times New Roman', serif;
    font-style: italic;
}

/* App Grid 2x2 */
.app-grid-2x2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    gap: 15px;
    width: 100%;
    height: 100%;
}
.app-grid-2x2 .icon-customizable {
    width: 100%;
    height: 100%;
    margin: 0;
    background: rgba(255,255,255,0.4);
    backdrop-filter: blur(5px);
    border-radius: 18px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}
.app-grid-2x2 .icon-customizable i {
    font-size: 28px;
    color: #fff;
    margin-bottom: 5px;
}
.app-grid-2x2 .icon-customizable span {
    font-size: 11px;
    color: #fff;
    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
}

/* Page 2: Mini Polaroids Row */
.polaroid-row-widget {
    display: flex;
    gap: 10px;
    height: 140px;
}
.mini-polaroid {
    flex: 1;
    background: #fff;
    padding: 5px 5px 20px 5px;
    box-shadow: 1px 3px 10px rgba(0,0,0,0.1);
    position: relative;
    background-size: cover;
    background-position: center;
    cursor: pointer;
}
.mini-polaroid:nth-child(1) { transform: rotate(-4deg); }
.mini-polaroid:nth-child(2) { transform: rotate(2deg); margin-top: 10px; }
.mini-polaroid:nth-child(3) { transform: rotate(-2deg); }
.tape {
    position: absolute;
    top: -8px;
    left: 50%;
    transform: translateX(-50%) rotate(-2deg);
    width: 40px;
    height: 15px;
    background: rgba(255, 235, 180, 0.7);
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

/* Large Rounded Widget */
.large-rounded-widget {
    width: 100%;
    height: 100%;
    background: rgba(255,255,255,0.3);
    backdrop-filter: blur(10px);
    border-radius: 35px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.05);
    background-size: cover;
    background-position: center;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
}

/* Floating Dock */
.floating-dock {
    position: absolute;
    bottom: 25px;
    left: 50%;
    transform: translateX(-50%);
    width: 85%;
    height: 70px;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-radius: 35px;
    display: flex;
    justify-content: space-around;
    align-items: center;
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    border: 1px solid rgba(255,255,255,0.3);
    z-index: 100;
}
.floating-dock .icon-customizable {
    margin: 0;
}
''')
    print("style.css updated successfully.")

def update_app_js():
    with open('app.js', 'r', encoding='utf-8') as f:
        js = f.read()

    new_js = """
// --- NEW UI IMAGE UPLOADS ---
const newImageTargets = [
    { id: 'upload-capsule-bg', target: 'capsule-widget-bg', isBg: true },
    { id: 'upload-capsule-avatar', target: 'image-target-capsule-avatar', isBg: true },
    { id: 'upload-small-rounded', target: 'image-target-small-rounded', isBg: true },
    { id: 'upload-polaroid-1', target: 'image-target-polaroid-1 .polaroid-inner', isBg: true },
    { id: 'upload-original-square', target: 'image-target-original-square', isBg: true },
    { id: 'upload-polaroid-row-1', target: 'image-target-polaroid-row-1', isBg: true },
    { id: 'upload-polaroid-row-2', target: 'image-target-polaroid-row-2', isBg: true },
    { id: 'upload-polaroid-row-3', target: 'image-target-polaroid-row-3', isBg: true },
    { id: 'upload-large-rounded', target: 'image-target-large-rounded', isBg: true }
];

newImageTargets.forEach(item => {
    const input = document.getElementById(item.id);
    if(input) {
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if(file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const base64 = event.target.result;
                    localStorage.setItem('custom_img_' + item.id, base64);
                    applyCustomImg(item.id, item.target, base64, item.isBg);
                };
                reader.readAsDataURL(file);
            }
        });
    }
});

function applyCustomImg(inputId, targetSelector, base64, isBg) {
    let el = document.getElementById(targetSelector) || document.querySelector('#' + targetSelector);
    if(el) {
        if(isBg) {
            el.style.backgroundImage = `url(${base64})`;
            const icon = el.querySelector('.empty-icon');
            if(icon) icon.style.display = 'none';
        } else {
            el.src = base64;
        }
    }
}

// Load saved new UI images
newImageTargets.forEach(item => {
    const saved = localStorage.getItem('custom_img_' + item.id);
    if(saved) {
        applyCustomImg(item.id, item.target, saved, item.isBg);
    }
});
"""
    if "NEW UI IMAGE UPLOADS" not in js:
        with open('app.js', 'a', encoding='utf-8') as f:
            f.write('\n' + new_js)
        print("app.js updated successfully.")

if __name__ == '__main__':
    update_index_html()
    update_css()
    update_app_js()
