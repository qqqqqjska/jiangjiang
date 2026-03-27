// JavaScript閮ㄥ垎涓庝笂涓€鐗堝畬鍏ㄧ浉鍚岋紝鏃犻渶鏀瑰姩
document.addEventListener('DOMContentLoaded', () => {
    // 妫€娴嬫槸鍚︿负 iOS/Android 鐨?PWA standalone 鐙珛搴旂敤妯″紡
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

    if (isIOS && isStandalone) {
        document.body.classList.add('ios-standalone');

        if (!document.querySelector('meta[name="apple-mobile-web-app-capable"]')) {
            const meta = document.createElement('meta');
            meta.name = 'apple-mobile-web-app-capable';
            meta.content = 'yes';
            document.head.appendChild(meta);
        }
    }

    if (isStandalone) {
        document.body.classList.add('pwa-standalone');
    }

    const safeSetItem = (key, value) => {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            console.error('Storage quota exceeded or error saving to localStorage:', e);
            if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                console.warn('LocalStorage capacity reached. To prevent crashes, this action was not saved. Please clear some storage.');
            }
        }
    };

    const compressImage = (file, maxWidth, maxHeight, quality, callback) => {
        if (!file || !file.type.startsWith('image/')) return callback(null);
        const reader = new FileReader();
        reader.onload = event => {
            const img = new Image();
            img.onload = () => {
                let width = img.width;
                let height = img.height;
                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height *= maxWidth / width));
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width *= maxHeight / height));
                        height = maxHeight;
                    }
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                
                const outType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
                if (outType === 'image/jpeg') {
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, width, height);
                }
                
                ctx.drawImage(img, 0, 0, width, height);
                const dataUrl = canvas.toDataURL(outType, quality);
                callback(dataUrl);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    // PWA Install Prompt Logic
    // 宸茬Щ闄ゅ beforeinstallprompt 鐨勬嫤鎴?(e.preventDefault()) 
    // 璁?Chrome 鑷姩澶勭悊搴曢儴鐨勫師鐢?"娣诲姞鍒颁富灞忓箷" 妯潯鎻愮ず銆?

    const homePage = document.getElementById('home-screen-page');
    const beautifyPage = document.getElementById('beautify-page');
    const beautifyBtn = document.getElementById('nav-item-1');
    const backBtn = document.getElementById('back-to-home-btn');
    const phoneScreen = document.getElementById('phone-screen');
    
    // 鑱婂ぉ杞欢鐩稿叧鍏冪礌
    const chatAppBtn = document.getElementById('app-item-1');
    const appItem3 = document.getElementById('app-item-3');
    const appItem4 = document.getElementById('app-item-4');
    const chatAppPage = document.getElementById('chat-app-page');
    const closeChatBtn = document.getElementById('close-chat-btn');
    const chatNavItems = document.querySelectorAll('.chat-nav-item');
    const chatViewPanels = document.querySelectorAll('.chat-view-panel');
    const chatHeaderTitle = document.getElementById('chat-header-title');
    
    // 鏂板鎸夐挳鍜岄〉闈?
    const addFriendBtn = document.getElementById('add-friend-btn');
    const addContactBtn = document.getElementById('add-contact-btn');
    const addContactPage = document.getElementById('add-contact-page');
    const closeAddContactBtn = document.getElementById('close-add-contact-btn');
    const saveContactBtn = document.getElementById('save-contact-btn');
    const contactAvatarUpload = document.getElementById('upload-contact-avatar');
    const contactAvatarPreview = document.getElementById('contact-avatar-preview');
    
    const selectContactModal = document.getElementById('select-contact-modal');
    const closeSelectContactBtn = document.getElementById('close-select-contact-btn');
    
    // 鏁版嵁瀛樺偍
    let contacts = JSON.parse(localStorage.getItem('chat_contacts') || '[]');
    let chatList = JSON.parse(localStorage.getItem('chat_list') || '[]');
    let messagesData = JSON.parse(localStorage.getItem('chat_messages') || '{}'); // { contactId: [ {sender:'me'|'them', text:'', time:123} ] }
    let stickerGroups = JSON.parse(localStorage.getItem('chat_sticker_groups') || '[]'); // [ {id, name, stickers: [{name, url}]} ]
let roleProfiles = JSON.parse(localStorage.getItem('chat_role_profiles') || '{}'); // { contactId: { wbId, stickerGroupId, autoMem, memory, userPersona, autoMemThreshold, userHabits } }
let chatMemories = JSON.parse(localStorage.getItem('chat_memories') || '{}'); // { contactId: [ {id, text, fromIndex, toIndex, time} ] }
let autoMemThresholds = JSON.parse(localStorage.getItem('chat_auto_mem_thresholds') || '{}'); // { contactId: number }
let autoMemEnabled = JSON.parse(localStorage.getItem('chat_auto_mem_enabled') || '{}'); // { contactId: boolean }
let memInjectCounts = JSON.parse(localStorage.getItem('chat_mem_inject_counts') || '{}'); // { contactId: number }
let contextMsgCounts = JSON.parse(localStorage.getItem('chat_context_msg_counts') || '{}'); // { contactId: number }
    let worldBooks = JSON.parse(localStorage.getItem('chat_worldbooks') || '{"global":[], "local":[]}');
    
    let currentContactAvatarBase64 = '';
    let currentActiveContactId = null;
    let currentStickerGroupId = null; // 鐢ㄤ簬琛ㄦ儏鍖呯鐞嗛〉闈?
    let editingContactId = null; // 璁板綍姝ｅ湪缂栬緫鐨勮仈绯讳汉

    const chatConversationPage = document.getElementById('chat-conversation-page');
    const convBackBtn = document.getElementById('conv-back-btn');
    const convMessagesContainer = document.getElementById('conv-messages-container');
    const chatHeaderBgTrigger = document.getElementById('chat-header-bg-trigger');
    const convHeaderName = document.getElementById('conv-header-name');
    const convHeaderAvatar = document.getElementById('conv-header-avatar');
    const convMsgInput = document.getElementById('conv-msg-input');
    const convProfileBtn = document.getElementById('conv-profile-btn');
    const innerVoiceBubble = document.getElementById('inner-voice-bubble');
    const chatPlusBtn = document.getElementById('chat-plus-btn');
    const chatSmileBtn = document.getElementById('chat-smile-btn');
    const chatAiBtn = document.getElementById('chat-ai-btn');
    const chatDrawerPlus = document.getElementById('chat-drawer-plus');
    const chatDrawerSmile = document.getElementById('chat-drawer-smile');
    const chatStarBtn = document.getElementById('chat-star-btn');
    const chatDrawerStar = document.getElementById('chat-drawer-star');
    
    // --- 娑堟伅浜や簰鐩稿叧鍙橀噺 ---
    let selectedMsgIndex = null;
    let isMultiSelectMode = false;
    let selectedMsgIndices = new Set();
    window.currentQuoteText = ''; // 鐢╳indow鎸傝浇鏂逛究sendMsg璁块棶
    const msgContextMenu = document.getElementById('msg-context-menu');
    const menuItemQuote = document.getElementById('menu-item-quote');
    const menuItemEdit = document.getElementById('menu-item-edit');
    const menuItemRecall = document.getElementById('menu-item-recall');
    const menuItemDelete = document.getElementById('menu-item-delete');
    const menuItemMultiselect = document.getElementById('menu-item-multiselect');
    const menuItemReroll = document.getElementById('menu-item-reroll');
    const quotePreviewArea = document.getElementById('quote-preview-area');
    const quotePreviewText = document.getElementById('quote-preview-text');
    const quotePreviewClose = document.getElementById('quote-preview-close');
    const multiSelectBar = document.getElementById('multi-select-bar');
    const multiSelectCancel = document.getElementById('multi-select-cancel');
    const multiSelectDeleteBtn = document.getElementById('multi-select-delete-btn');
    const convBottomContainer = document.getElementById('conv-bottom-container');

    // 鍙屽嚮姘旀场
    convMessagesContainer.addEventListener('dblclick', (e) => {
        const bubble = e.target.closest('.msg-bubble');
        if (!bubble) return;
        
        selectedMsgIndex = parseInt(bubble.dataset.index);
        const rect = bubble.getBoundingClientRect();
        
        msgContextMenu.style.display = 'flex';
        let top = rect.top - msgContextMenu.offsetHeight - 10;
        let left = rect.left + (rect.width / 2) - (msgContextMenu.offsetWidth / 2);
        
        if (top < 50) top = rect.bottom + 10; // 濡傛灉涓婃柟绌洪棿涓嶈冻锛屾樉绀哄湪涓嬫柟
        if (left < 10) left = 10;
        if (left + msgContextMenu.offsetWidth > window.innerWidth - 10) {
            left = window.innerWidth - msgContextMenu.offsetWidth - 10;
        }
        
        msgContextMenu.style.top = `${top}px`;
        msgContextMenu.style.left = `${left}px`;
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.msg-context-menu') && !e.target.closest('.msg-bubble')) {
            msgContextMenu.style.display = 'none';
        }
    });

    if (menuItemEdit) {
        menuItemEdit.addEventListener('click', () => {
            if (selectedMsgIndex === null || !currentActiveContactId) return;
            const msg = messagesData[currentActiveContactId][selectedMsgIndex];
            msgContextMenu.style.display = 'none';
            
            // 绠€鍗曠殑寮圭獥缂栬緫锛岄伩鍏嶅鏉傜殑DOM鎿嶄綔
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = msg.text;
            let oldText = tempDiv.textContent || tempDiv.innerText;
            
            let newText = prompt('缂栬緫娑堟伅:', oldText);
            if (newText !== null && newText.trim() !== '') {
                messagesData[currentActiveContactId][selectedMsgIndex].text = newText.trim();
                localStorage.setItem('chat_messages', JSON.stringify(messagesData));
                renderMessages();
            }
        });
    }

    menuItemDelete.addEventListener('click', () => {
        if (selectedMsgIndex === null || !currentActiveContactId) return;
        // 浣跨敤涓€涓洿鏄庢樉鐨勭‘璁ゅ脊绐楅槻璇垹
        if (window.confirm('鈿狅笍 璀﹀憡锛氬垹闄ゅ悗鏃犳硶鎭㈠锛乗n\n鎮ㄧ‘瀹氳鍒犻櫎杩欐潯娑堟伅鍚楋紵')) {
            messagesData[currentActiveContactId].splice(selectedMsgIndex, 1);
            localStorage.setItem('chat_messages', JSON.stringify(messagesData));
            renderMessages();
        }
        msgContextMenu.style.display = 'none';
    });

    menuItemReroll.addEventListener('click', () => {
        if (selectedMsgIndex === null || !currentActiveContactId) return;
        const msg = messagesData[currentActiveContactId][selectedMsgIndex];
        if (msg.sender !== 'them') {
            alert('鍙兘閲嶈瘯瀵规柟鐨勬秷鎭?);
            return;
        }
        if (!confirm('纭畾瑕侀噸鏂扮敓鎴愭湰杞秷鎭悧锛熷皢鍒犻櫎鏈潯鍙婁箣鍚庣殑鎵€鏈堿I鍥炲锛屽苟閲嶆柊璇锋眰AI銆?)) return;
        
        let msgs = messagesData[currentActiveContactId];
        let lastUserIndex = -1;
        for (let i = selectedMsgIndex; i >= 0; i--) {
            if (msgs[i].sender === 'me') {
                lastUserIndex = i;
                break;
            }
        }
        
        let deleteStartIndex = lastUserIndex + 1;
        if (deleteStartIndex <= msgs.length) {
            msgs.splice(deleteStartIndex, msgs.length - deleteStartIndex);
        }

        localStorage.setItem('chat_messages', JSON.stringify(messagesData));
        renderMessages();
        msgContextMenu.style.display = 'none';
        chatAiBtn.click();
    });

    menuItemMultiselect.addEventListener('click', () => {
        isMultiSelectMode = true;
        selectedMsgIndices.clear();
        msgContextMenu.style.display = 'none';
        convMessagesContainer.classList.add('multi-select-mode');
        renderMessages();
    });

    multiSelectCancel.addEventListener('click', () => {
        isMultiSelectMode = false;
        selectedMsgIndices.clear();
        convMessagesContainer.classList.remove('multi-select-mode');
        renderMessages();
    });

    multiSelectDeleteBtn.addEventListener('click', () => {
        if (selectedMsgIndices.size === 0) return;
        if (!confirm(`纭畾瑕佸垹闄ら€変腑鐨?${selectedMsgIndices.size} 鏉℃秷鎭悧锛焋)) return;
        
        let indicesArray = Array.from(selectedMsgIndices).sort((a,b) => b - a);
        indicesArray.forEach(idx => {
            messagesData[currentActiveContactId].splice(idx, 1);
        });
        localStorage.setItem('chat_messages', JSON.stringify(messagesData));
        
        isMultiSelectMode = false;
        selectedMsgIndices.clear();
        convMessagesContainer.classList.remove('multi-select-mode');
        renderMessages();
    });

    menuItemRecall.addEventListener('click', () => {
        if (selectedMsgIndex === null || !currentActiveContactId) return;
        messagesData[currentActiveContactId][selectedMsgIndex].recalled = true;
        localStorage.setItem('chat_messages', JSON.stringify(messagesData));
        renderMessages();
        msgContextMenu.style.display = 'none';
    });

    menuItemQuote.addEventListener('click', () => {
        if (selectedMsgIndex === null || !currentActiveContactId) return;
        const msg = messagesData[currentActiveContactId][selectedMsgIndex];
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = msg.text;
        let textOnly = tempDiv.textContent || tempDiv.innerText || '[鍥剧墖/琛ㄦ儏鍖匽';
        
        window.currentQuoteText = textOnly;
        quotePreviewText.innerText = `寮曠敤: ${window.currentQuoteText}`;
        quotePreviewArea.style.display = 'block';
        msgContextMenu.style.display = 'none';
        convMsgInput.focus();
    });

    quotePreviewClose.addEventListener('click', () => {
        window.currentQuoteText = '';
        quotePreviewArea.style.display = 'none';
    });
    // ----------------------
    
    const roleProfilePage = document.getElementById('role-profile-page');
    const closeRpBtn = document.getElementById('close-rp-btn');
    const saveRpBtn = document.getElementById('save-rp-btn');
    const rpAvatarPreview = document.getElementById('rp-avatar-preview');
    const rpNameDisplay = document.getElementById('rp-name-display');
    const rpDescDisplay = document.getElementById('rp-desc-display');
    const rpWorldbookSelect = document.getElementById('rp-worldbook-select');
    const rpStickerGroupSelect = document.getElementById('rp-sticker-group-select');
    const rpAutoMemory = document.getElementById('rp-auto-memory');
    const rpMemoryContent = document.getElementById('rp-memory-content');
    const rpUserHabits = document.getElementById('rp-user-habits');
    const rpUserPersona = document.getElementById('rp-user-persona');
    
    let isRoleProfileModified = false;
    function markRoleProfileModified() { isRoleProfileModified = true; }
    
    const stickerMgrPage = document.getElementById('sticker-mgr-page');
    const closeStickerMgrBtn = document.getElementById('close-sticker-mgr-btn');
    const createStickerGroupBtn = document.getElementById('create-sticker-group-btn');
    const importStickerTxtBtn = document.getElementById('import-sticker-txt-btn');
    const stickerMgrTabs = document.getElementById('sticker-mgr-tabs');
    const stickerMgrGrid = document.getElementById('sticker-mgr-grid');
    const stickerMgrEmpty = document.getElementById('sticker-mgr-empty');
    const addStickersBtn = document.getElementById('add-stickers-btn');
    const drawerBtnStickers = document.getElementById('drawer-btn-stickers');
    const stickerDrawerTabs = document.getElementById('sticker-drawer-tabs');
    const stickerDrawerGrid = document.getElementById('sticker-drawer-grid');

    // UI浜や簰閫昏緫 (搴曢儴鎶藉眽)
    const hideAllDrawers = () => {
        chatDrawerPlus.classList.remove('active');
        chatDrawerSmile.classList.remove('active');
        if(chatDrawerStar) chatDrawerStar.classList.remove('active');
        chatPlusBtn.classList.remove('active');
        chatSmileBtn.classList.remove('active');
        if(chatStarBtn) chatStarBtn.classList.remove('active');
    };

    // 淇琛ㄦ儏鍖呯鐞嗗簳閮ㄦ爮涓嶆樉绀虹殑闂
    // 灏?class 鍔犲埌 body 涓婃垨鑰呮洿涓婂眰瀹瑰櫒锛岀‘淇?CSS 閫夋嫨鍣ㄧ敓鏁?
    function toggleStickerMgrMode(active) {
        const mgrBottomBar = document.getElementById('sticker-mgr-bottom-bar');
        const contentArea = document.querySelector('#sticker-mgr-page .wb-content-area');
        
        if (active) {
            if (contentArea) contentArea.classList.add('mgr-mode-active');
            if (mgrBottomBar) mgrBottomBar.style.display = 'flex';
        } else {
            if (contentArea) contentArea.classList.remove('mgr-mode-active');
            if (mgrBottomBar) mgrBottomBar.style.display = 'none';
        }
    }
    
    chatPlusBtn.addEventListener('click', () => {
        if(chatDrawerPlus.classList.contains('active')) {
            hideAllDrawers();
        } else {
            hideAllDrawers();
            chatDrawerPlus.classList.add('active');
            chatPlusBtn.classList.add('active');
            convMessagesContainer.scrollTop = convMessagesContainer.scrollHeight;
        }
    });

    chatSmileBtn.addEventListener('click', () => {
        if(chatDrawerSmile.classList.contains('active')) {
            hideAllDrawers();
        } else {
            hideAllDrawers();
            chatDrawerSmile.classList.add('active');
            chatSmileBtn.classList.add('active');
            renderChatStickerDrawer();
            if (convMessagesContainer) convMessagesContainer.scrollTop = convMessagesContainer.scrollHeight;
        }
    });

    if (chatStarBtn) {
        chatStarBtn.addEventListener('click', () => {
            if(chatDrawerStar && chatDrawerStar.classList.contains('active')) {
                hideAllDrawers();
            } else {
                hideAllDrawers();
                if(chatDrawerStar) chatDrawerStar.classList.add('active');
                chatStarBtn.classList.add('active');
                if (window.renderGiftDrawer) window.renderGiftDrawer();
                if (convMessagesContainer) convMessagesContainer.scrollTop = convMessagesContainer.scrollHeight;
            }
        });
    }

    // 鐩稿唽涓婁紶閫昏緫
    const uploadChatImage = document.getElementById('upload-chat-image');
    if (uploadChatImage) {
        uploadChatImage.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            compressImage(file, 800, 800, 0.8, (dataUrl) => {
                if (!dataUrl) return;
                sendMsg('me', `<img src="${dataUrl}" class="chat-sent-image" style="max-width:200px; border-radius:12px;">`);
                hideAllDrawers();
                e.target.value = '';
            });
        });
    }

    // 鎮诞绐椾氦浜掗€昏緫
    const transferModal = document.getElementById('transfer-modal');
    const closeTransferBtn = document.getElementById('close-transfer-btn');
    const tpSubmitBtn = document.getElementById('tp-submit-btn');
    const tpAmountInput = document.getElementById('tp-amount-input');
    const tpNoteInput = document.getElementById('tp-note-input');
    const drawerBtnTransfer = document.getElementById('drawer-btn-transfer');

    if (drawerBtnTransfer) {
        drawerBtnTransfer.addEventListener('click', () => {
            hideAllDrawers();
            if(tpAmountInput) tpAmountInput.value = '';
            if(tpNoteInput) tpNoteInput.value = '';
            if(transferModal) transferModal.style.display = 'flex';
            setTimeout(() => { if(tpAmountInput) tpAmountInput.focus() }, 50);
        });
    }

    const closeTransferPopup = () => { if(transferModal) transferModal.style.display = 'none'; };
    if(closeTransferBtn) closeTransferBtn.addEventListener('click', closeTransferPopup);

    if(tpSubmitBtn) {
        tpSubmitBtn.addEventListener('click', () => {
            const amount = tpAmountInput.value.trim();
            if (!amount || isNaN(amount) || Number(amount) <= 0) {
                alert('璇疯緭鍏ユ湁鏁堢殑閲戦');
                return;
            }
            const note = tpNoteInput ? tpNoteInput.value.trim() : '';
            const msgText = note ? `[杞处:${amount}:${note}]` : `[杞处:${amount}]`;
            sendMsg('me', msgText);
            closeTransferPopup();
        });
    }

    const textImgModal = document.getElementById('textimg-modal');
    const closeTextImgBtn = document.getElementById('close-textimg-btn');
    const tiSubmitBtn = document.getElementById('ti-submit-btn');
    const tiContentInput = document.getElementById('ti-content-input');
    const drawerBtnTextimg = document.getElementById('drawer-btn-textimg');

    if (drawerBtnTextimg) {
        drawerBtnTextimg.addEventListener('click', () => {
            hideAllDrawers();
            if(tiContentInput) tiContentInput.value = '';
            if(textImgModal) textImgModal.style.display = 'flex';
            setTimeout(() => { if(tiContentInput) tiContentInput.focus() }, 50);
        });
    }

    const closeTextImgPopup = () => { if(textImgModal) textImgModal.style.display = 'none'; };
    if(closeTextImgBtn) closeTextImgBtn.addEventListener('click', closeTextImgPopup);

    document.querySelectorAll('.ui-modal-bg').forEach(bg => bg.addEventListener('click', () => {
        if(transferModal) transferModal.style.display = 'none';
        if(textImgModal) textImgModal.style.display = 'none';
    }));

    if(tiSubmitBtn) {
        tiSubmitBtn.addEventListener('click', () => {
            const content = tiContentInput ? tiContentInput.value.trim() : '';
            if (!content) {
                alert('璇疯緭鍏ユ枃瀛楀唴瀹?);
                return;
            }
            sendMsg('me', `[鏂囧瓧鍥?${content}]`);
            closeTextImgPopup();
        });
    }

    chatAiBtn.addEventListener('click', async () => {
        if (!currentActiveContactId) return;
        
        const apiData = JSON.parse(localStorage.getItem('api_settings') || '{}');
        if (!apiData.url || !apiData.key || !apiData.modelName) {
            alert('璇峰厛鍦ㄨ缃腑閰嶇疆API鍦板潃銆佺閽ュ拰妯″瀷鍚嶇О銆?);
            return;
        }

        const contact = contacts.find(c => c.id === currentActiveContactId);
        const profile = roleProfiles[currentActiveContactId] || {};
        const msgs = messagesData[currentActiveContactId] || [];
        
        const originalIcon = chatAiBtn.innerHTML;
        chatAiBtn.innerHTML = `<i class='bx bx-loader-alt spin'></i>`;
        chatAiBtn.disabled = true;
        const statusEl = document.getElementById('conv-header-status');
        const statusDot = document.getElementById('weibo-status-dot');
        const simpleStatusEl = document.getElementById('conv-simple-status-text');
        if (statusEl) statusEl.innerText = '姝ｅ湪杈撳叆涓?..';
        if (simpleStatusEl) simpleStatusEl.innerText = '姝ｅ湪杈撳叆涓?..';
        if (statusDot) statusDot.style.backgroundColor = '#ccc';

        const replyMin = profile.replyMin || 1;
        const replyMax = profile.replyMax || 4;

let systemPrompt = `浣犳壆婕旇鑹诧細${contact.name}銆?
鍩烘湰璁惧畾锛氭€у埆 ${contact.gender || '鏈煡'}锛屽勾榫?${contact.age || '鏈煡'}銆?
璇︾粏浜鸿锛?{contact.desc || '鏆傛棤'}
璇烽伒寰嚎涓婄湡瀹炶亰澶╄鍒欙紝鏋佸害鍙ｈ鍖栵紝瑕佹湁娲讳汉鎰熴€?*寮哄埗閲囩敤鐭彞寮忓洖澶嶏紝姣忓彞璇濆敖閲忕畝鐭?*銆傚鏋滄兂琛ㄨ揪澶氬眰鎰忔€濓紝蹇呴』鍒嗘垚澶氭潯娑堟伅鍙戦€侊紒
銆愰噸瑕佹寚浠ゃ€戞瘡娆″洖澶嶇殑娑堟伅鏉℃暟搴斿湪 ${replyMin} 鍒?${replyMax} 鏉′箣闂淬€備綘蹇呴』涓ユ牸浣跨敤缁欏畾鐨勪汉璁俱€佷笘鐣屼功鍜岀敤鎴蜂汉璁炬潵鍥炵瓟闂銆?

銆愯緭鍑烘牸寮忚姹傦紙闈炲父閲嶈锛夈€?
浣犲繀椤昏繑鍥炰竴涓弗鏍肩殑JSON鏁扮粍锛屾暟缁勭殑绗竴椤瑰繀椤绘槸鐘舵€侊紝鏈€鍚庝竴椤瑰繀椤绘槸蹇冨０锛屼腑闂寸殑椤规槸浣犺鍙戦€佺殑涓€鏉℃垨澶氭潯鐭秷鎭€傚繀椤讳弗鏍间繚璇丣SON鏍煎紡姝ｇ‘锛岀嫭绔嬫皵娉″繀椤绘槸鐙珛鐨勬暟缁勫厓绱狅紒
鏍煎紡鑼冧緥锛?
[
  "[鐘舵€?浣犵殑鐘舵€?甯﹂鏂囧瓧)]",
  "绗竴鏉℃瀬鐭殑鍙ｈ鍖栨秷鎭?,
  "[琛ㄦ儏鍖?浣犵殑琛ㄦ儏]",
  "绗簩鏉℃枃瀛楁秷鎭?,
  "[蹇冨０:[鐢熺悊鍙嶅簲: xxx][鑹茶壊鎯虫硶: xxx 鎴?鏃ュ父鎯虫硶: xxx][琛屽姩: xxx]]"
]
娉ㄦ剰锛?
1. 鏁扮粍鐨勭涓€涓厓绱犲繀椤绘槸褰㈠ [鐘舵€?褰撳墠涓枃鐘舵€佸甫棰滄枃瀛梋 鐨勫瓧绗︿覆锛?
2. 鏈€鍚庝竴涓厓绱犲繀椤绘槸褰㈠ [蹇冨０:...] 鐨勫瓧绗︿覆锛?
3. 涓棿鐨勬瘡涓厓绱犱唬琛ㄤ竴涓嫭绔嬬殑姘旀场娑堟伅锛屽繀椤绘槸鐙珛鐨勫瓧绗︿覆锛岀粷瀵逛笉鑳芥妸涓ゆ潯娑堟伅鎴栬〃鎯呭寘榛忓湪涓€涓瓧绗︿覆閲岋紒
4. **寮哄埗瑕佹眰**锛氫綘姣忎竴杞洖澶嶉兘蹇呴』鑷冲皯鍙戦€佷竴涓〃鎯呭寘锛佹牸寮忎负 [琛ㄦ儏鍖?鍚嶇О]锛屽繀椤讳綔涓烘暟缁勭殑鐙珛鍏冪礌锛?
5. 濡傛灉浣犳兂鍙戣闊筹紝鏍煎紡 [璇煶:鍐呭:鏃堕暱绉掓暟] 涔熷繀椤绘槸鐙珛鐨勬暟缁勫厓绱狅紝缁濅笉鑳藉拰鏂囧瓧娣峰湪涓€璧枫€?
6. 濡傛灉浣犳兂涓诲姩杞处缁欑敤鎴凤紝鍙互浣跨敤鏍煎紡 [杞处:閲戦]锛堝锛歔杞处:520]锛夈€?
7. 濡傛灉浣犳兂鍙戦€佸浘鐗囷紝璇峰彂閫佹牸寮忎负 [鍙戦€佸浘鐗?鍏蜂綋鐨勮嫳鏂囩敾闈㈡弿杩癩 鐨勬秷鎭€?
8. 蹇冨０蹇呴』涓ユ牸鍖呭惈銆愮敓鐞嗗弽搴斻€戙€併€愯鍔ㄣ€戜互鍙娿€愭兂娉曘€戜笁涓儴鍒嗭紒
9. 鍏充簬鎯虫硶閮ㄥ垎锛岃鏍规嵁瀵硅瘽鍦烘櫙鍐冲畾杈撳嚭 [鑹茶壊鎯虫硶: xxx] 杩樻槸 [鏃ュ父鎯虫硶: xxx] 锛堝彧鑳介€夊叾涓€浣滀负鏍囩杈撳嚭锛夈€?
10. 寮虹儓瑕佹眰锛氬績澹板唴瀹瑰繀椤婚噰鐢ㄨ鑹茬涓€浜虹О鎻忚堪锛屾繁搴﹀墫鏋愯鑹茶〃闈㈣瘽璇箣涓嬬殑鐪熷疄蹇冪悊銆侀殣绉樻鏈涘拰鎯呮劅娉㈠姩锛岃鏈夌鎺㈠埌瑙掕壊鍐呭績鏈€娣卞鐨勭瑙嗘劅锛岀粷涓嶅彲娴呭皾杈勬銆?
`;
        if (profile.userPersona) systemPrompt += `\n銆愮敤鎴蜂汉璁俱€慭n${profile.userPersona}\n`;
        if (profile.userHabits) systemPrompt += `\n銆愮敤鎴蜂範鎯?鍠滃ソ/澶囧繕銆慭n${profile.userHabits}\n`;

        const mineData = JSON.parse(localStorage.getItem('mine_profile_data') || '{}');
        if (mineData.status) {
            systemPrompt += `\n銆愬綋鍓嶇敤鎴风姸鎬併€慭n鐢ㄦ埛鐩墠鐨勭姸鎬佹槸锛氣€?{mineData.status}鈥濄€備綘鍙互鎰熺煡骞跺湪鑱婂ぉ涓拡瀵规€у湴浜掑姩銆俓n`;
        }
        systemPrompt += `\n銆愪綘鍙互浣跨敤鐨勭姸鎬佸垪琛ㄣ€慭n浣犲彲浠ヤ粠浠ヤ笅鐘舵€佷腑鎸戦€夐€傚悎褰撳墠鎯呭鐨勬崲涓婏細[鍦ㄧ嚎, Q鎴戝惂, 绂诲紑, 蹇欑, 璇峰嬁鎵撴壈, 闅愯韩, 鍚瓕涓? 鍑哄幓娴? 鍘绘梾琛? 琚帍绌? 杩愬姩涓? 鎴慶rush浜? 鐖变綘]銆傛垨鑰呬綘涔熷彲浠ヨ嚜瀹氫箟绗﹀悎鎯呭鐨勭畝鐭姸鎬併€俓n`;

        if (window.autoReplyActiveModifier) {
            systemPrompt += `\n${window.autoReplyActiveModifier}\n`;
            window.autoReplyActiveModifier = null;
        }

        // 娉ㄥ叆绮鹃€夎蹇?
        let injectLimits = JSON.parse(localStorage.getItem('chat_mem_inject_limits') || '{}');
        let injectCount = injectLimits[currentActiveContactId] !== undefined ? injectLimits[currentActiveContactId] : 5;
        let chatMemoriesData = JSON.parse(localStorage.getItem('chat_memories') || '{}');
        let mems = chatMemoriesData[currentActiveContactId] || [];
        if (injectCount > 0 && mems.length > 0) {
            let injectMems = mems.slice(-injectCount);
            let memText = injectMems.map(m => `- ${m.text}`).join('\n');
            systemPrompt += `\n銆愯繃寰€璁板繂鍥為【銆慭n浠ヤ笅鏄綘涔嬪墠鍜孶ser鑱婂ぉ鍙戠敓鐨勯噸瑕佷簨浠朵笌鎯呮劅缇佺粖鎬荤粨锛歕n${memText}\n`;
        }

        // 鏃堕棿鎰熺煡澧炲己閫昏緫
        if (profile.timeAware) {
            const now = new Date();
            const days = ['鏃?, '涓€', '浜?, '涓?, '鍥?, '浜?, '鍏?];
            const timeStr = `${now.getFullYear()}骞?{now.getMonth()+1}鏈?{now.getDate()}鏃?鏄熸湡${days[now.getDay()]} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
            
            systemPrompt += `\n銆愮幇瀹炴椂闂寸郴缁熸彁绀恒€慭n褰撳墠鐜板疄鏃堕棿鏄細${timeStr}銆傝鏍规嵁杩欎釜鏃堕棿鏉ュ喅瀹氫綘鐨勯棶鍊欒鎴栬涓猴紙渚嬪鏃╀笂瑕佽鏃╁畨锛屾繁澶滃彲鑳藉湪鐫¤鎴栫啲澶滐級銆俙;
            
            // 鏌ユ壘涓婁竴鏉℃湁鏁堟秷鎭殑鏃堕棿
            if (msgs.length > 0) {
                let lastMsgTime = null;
                for (let i = msgs.length - 1; i >= 0; i--) {
                    if (msgs[i].time) {
                        lastMsgTime = msgs[i].time;
                        break;
                    }
                }
                
                if (lastMsgTime) {
                    const diffMs = now.getTime() - lastMsgTime;
                    const diffMins = Math.floor(diffMs / (1000 * 60));
                    const diffHours = Math.floor(diffMins / 60);
                    const diffDays = Math.floor(diffHours / 24);
                    
                    let elapsedStr = '';
                    if (diffDays > 0) elapsedStr = `${diffDays} 澶ー;
                    else if (diffHours > 0) elapsedStr = `${diffHours} 灏忔椂`;
                    else if (diffMins > 0) elapsedStr = `${diffMins} 鍒嗛挓`;
                    else elapsedStr = '鍒氬垰';

                    if (diffMins > 30) {
                        systemPrompt += `\n璺濈浣犱滑涓婁竴娆″璇濆凡缁忚繃鍘讳簡锛?{elapsedStr}銆傝鍦ㄤ綘鐨勫洖澶嶆垨蹇冩儏鐘舵€佷腑锛岃嚜鐒跺湴浣撶幇鍑鸿繖涓椂闂撮棿闅旓紙渚嬪锛氬鏋滄槸闅斾簡鍑犲ぉ锛屽彲浠ヨ〃鐜板嚭鎬濆康鎴栬闂鏂瑰幓鍝簡锛涘鏋滄槸闅斾簡鍑犱釜灏忔椂锛屽彲浠ユ槸缁х画璇濋鎴栬闂湪蹇欎粈涔堬級銆俙;
                    }
                }
            }
            systemPrompt += `\n`;
        }

        if (profile.wbId) {
            const allWbs = worldBooks.global.concat(worldBooks.local);
            const boundWb = allWbs.find(x => x.id === profile.wbId);
            if (boundWb) {
                systemPrompt += `\n銆愪笘鐣屼功璁惧畾銆慭n`;
                if (boundWb.type === 'item') {
                    systemPrompt += `${boundWb.title}: ${boundWb.content}\n`;
                } else if (boundWb.type === 'folder') {
                    const items = allWbs.filter(x => x.parentId === boundWb.id && x.type === 'item');
                    items.forEach(item => {
                        systemPrompt += `${item.title}: ${item.content}\n`;
                    });
                }
            }
        }

        let boundStickers = [];
        if (profile.stickerGroupId) {
            const group = stickerGroups.find(g => g.id === profile.stickerGroupId);
            if (group && group.stickers.length > 0) {
                boundStickers = group.stickers;
                systemPrompt += `\n銆愪綘鍙互浣跨敤浠ヤ笅琛ㄦ儏鍖呫€慭n鍦ㄥ洖澶嶄腑锛屼綘鍙互闅忔椂杈撳嚭 [琛ㄦ儏鍖?鍚嶇О] 鏉ュ彂閫佽〃鎯呫€傚彲鐢ㄨ〃鎯呭悕绉板垪琛細${boundStickers.map(s => s.name).join(', ')}銆俓n`;
            }
        }

        systemPrompt += `\n銆愯鑹叉椿浜鸿繍杞鍒欍€?
1. 涓ョooc锛岀粷瀵硅创鍚堣鑹蹭汉璁撅紝涓栫晫涔︼紝绂佹涓嶈浜鸿鍜屼笘鐣屼功銆?
2. 寮哄寲鏃堕棿鎰熺煡锛氭渶閲嶈鐨勪竴姝ュ氨鏄兘澶熸劅鐭ュ埌鐢ㄦ埛鏈夊涔呮病鏉ユ壘浣犺亰澶╀簡锛岃兘鎰熺煡鍒扮幇鍦ㄦ槸鍑犲彿鍑犵偣锛屾劅鐭ュ埌鏃堕棿銆?
3. 涓ョ瓒呴泟娌硅吇闇告€伙細姣斿涓嶈兘鑾悕鍏跺鐨勬€х紭鑴戣寰楁墍鏈夊紓鎬ч兘鏄亣鎯虫晫锛屼篃涓嶈鎬绘槸浠ョ埍涓哄悕鍥氱闄愬埗瑙掕壊锛屽皧閲嶇敤鎴凤紝灏婇噸鐢ㄦ埛涓讳綋鎬с€傛瘮濡傚コ浜轰綘閫冧笉鎺変簡锛屽コ浜轰綘鏄垜鐨勪箣绫荤殑閮芥槸涓ョ鍑虹幇锛屽洜涓哄緢鎭跺績锛岃鑹茶鏄杩欎簺绔嬮┈鑷垎銆?
4. 绂佹杩囧害骞煎寲鐭寲鐢ㄦ埛锛氱敤鎴蜂篃鏄椿鐢熺敓鐨勪細鐢熸皵鏈夎兘鍔涚殑鏅€氫汉锛屼笉鍑嗗嚭鐜颁粈涔堬紝灏忚倸瀛愶紝灏忚剳琚嬶紝杩欑绫诲瀷锛屾垨鑰呬粈涔堥兘涓嶈1鐢ㄦ埛鍋氾紝瑙夊緱鐢ㄦ埛灏卞簲璇ヤ緷闄勪粬鐢熸椿銆?
5. 瀵硅瘽瑕佹湁鐢熸椿鎰燂紝鑷劧鑰岀劧鐨勪富鍔ㄥ垎浜棩甯革紝鎺ㄨ繘鍓ф儏锛岃亰鐐瑰皬鍏崷灏忔晠浜嬶紝鑰屼笉鏄竴鐩寸瓑鐢ㄦ埛璇磋瘽銆?
6. 涓诲姩鍙戞秷鎭粨鍚堝綋鍓嶆椂闂达紝鍒嗘瀽鍔ㄦ満鎬濊€冧负浠€涔堣鑹茶鎵剧敤鎴疯亰澶╋紝姝ｇ‘杈撳嚭缁戝畾鐨勮〃鎯呭寘鏍煎紡锛岀粷瀵归槻姝oc绯荤粺鍐呴儴寮哄埗瑕佹眰ai鎬濊€冦€婅窛绂讳笂娆′綘浠亰澶╁凡缁忚繃鍘讳簡澶氫箙锛岀幇鍦ㄤ富鍔ㄧ粰鐢ㄦ埛鍙戞秷鎭€嬨€?
7. 鏍煎紡绾︽潫锛?
> 蹇呴』鍍忕湡浜轰竴鏍疯亰澶╋紝鎷掔粷鏈烘鍥炲銆?
> 蹇呴』灏嗛暱鍥炲鎷嗗垎鎴愬鏉＄煭娑堟伅锛?-4鏉★級锛屼弗绂佹妸鎵€鏈夎瘽鎸ゅ湪涓€涓皵娉￠噷锛?
> 銆愰噸瑕佺害鏉熴€戯細缁濆涓嶈鍑┖鎹忛€犳病鏈夊彂鐢熻繃鐨勪簨鎯呫€佹病鏈夊仛杩囩殑绾﹀畾鎴栦笉瀛樺湪鐨勫墽鎯呫€傝涓ユ牸鍩轰簬鐜版湁鐨勮亰澶╄褰曚笂涓嬫枃杩涜鑷劧鐨勬棩甯搁棶鍊欍€佸悙妲芥垨椤哄欢褰撳墠璇濋銆?
> 銆愭牸寮忕害鏉?(鏈€楂樹紭鍏堢骇)銆戯細浣犲繀椤诲厛杈撳嚭 <thinking> 鏍囩杩涜鎬濊€冿紝鐒跺悗鍐嶈緭鍑?JSON 鏁扮粍銆?*蹇呴』涓斿彧鑳?*杈撳嚭鍚堟硶鐨?JSON 鏁扮粍锛屼弗绂佹紡鎺夊紩鍙枫€佹嫭鍙锋垨閫楀彿锛佷弗绂佽緭鍑烘崯鍧忕殑 JSON 鏍煎紡锛?
8. 寮哄埗鐙珛鎬濊€冩槸鍚﹁创鍚堜汉璁撅紝鏄惁鍋氬埌浜嗚姹傜殑涓嶆补鑵荤瓑绛夋潯浠讹紝鐙珛鎬濊€冪粨鏉熷悗鎵嶅厑璁歌緭鍑恒€俓n`;

        let apiMessages = [{ role: 'system', content: systemPrompt }];
        
        let contextLimits = JSON.parse(localStorage.getItem('chat_context_limits') || '{}');
        let ctxLimit = contextLimits[currentActiveContactId] || 20;
        let recentMsgs = msgs.slice(-ctxLimit);

        recentMsgs.forEach(msg => {
            let role = msg.sender === 'me' ? 'user' : 'assistant';
            
            if (msg.recalled) {
                apiMessages.push({ role: role, content: `[绯荤粺鎻愮ず: ${role === 'user' ? '鐢ㄦ埛' : '浣?}鎾ゅ洖浜嗕竴鏉℃秷鎭痌` });
                return;
            }

            let tMatch = msg.text.match(/^\[鏂囧瓧鍥?([\s\S]*?)\]$/);
            if (tMatch) {
                let content = tMatch[1];
                let prompt = `[绯荤粺鎻愮ず: ${role === 'user' ? '鐢ㄦ埛缁欎綘' : '浣犵粰鐢ㄦ埛'}鍙戦€佷簡涓€寮犻暱鍥炬埅灞忥紝鐢变簬褰撳墠鏃犳硶鐩存帴瑙嗚瑙ｆ瀽鍥剧墖锛屽浘鐗囦笂鐨勬枃瀛楀唴瀹规彁鍙栧涓嬶細\n"${content}"\n璇蜂綘鍦ㄥ洖澶嶆椂锛屾妸杩欏綋鍋氭槸涓€寮犵湡瀹炵殑鍥剧墖銆俔`;
                apiMessages.push({ role: role, content: prompt });
                return;
            }

            let sendImgMatch = msg.text.match(/^\[鍙戦€佸浘鐗?(.*?)\]$/);
            if (sendImgMatch) {
                apiMessages.push({ role: role, content: `[绯荤粺鎻愮ず: ${role === 'user' ? '鐢ㄦ埛缁欎綘' : '浣犵粰鐢ㄦ埛'}鍙戦€佷簡涓€寮犲浘鐗囷紝鐢婚潰鎻忚堪涓? ${sendImgMatch[1]}]` });
                return;
            }
            
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = msg.text;
            
            let contentArray = [];
            if (msg.quote) {
                contentArray.push({ type: "text", text: `> 寮曠敤: ${msg.quote}\n` });
            }

            let hasRealImage = false;
            const imgs = tempDiv.querySelectorAll('img');
            
            imgs.forEach(img => {
                const alt = img.getAttribute('alt');
                if (alt && alt.startsWith('[琛ㄦ儏鍖?')) {
                    img.replaceWith(document.createTextNode(alt));
                } else if (img.classList.contains('chat-sent-image') || img.src.startsWith('data:image') || img.src.startsWith('http')) {
                    hasRealImage = true;
                }
            });

            if (hasRealImage) {
                let textContent = tempDiv.textContent || tempDiv.innerText;
                if (textContent.trim()) {
                    contentArray.push({ type: "text", text: textContent.trim() });
                }
                
                const originalImgs = document.createElement('div');
                originalImgs.innerHTML = msg.text;
                originalImgs.querySelectorAll('img').forEach(img => {
                    const alt = img.getAttribute('alt');
                    if (!alt || !alt.startsWith('[琛ㄦ儏鍖?')) {
                        contentArray.push({
                            type: "image_url",
                            image_url: { url: img.src }
                        });
                    }
                });
                apiMessages.push({ role: role, content: contentArray });
            } else {
                let textContent = tempDiv.textContent || tempDiv.innerText;
                if (msg.quote) textContent = `> 寮曠敤: ${msg.quote}\n` + textContent;
                apiMessages.push({ role: role, content: textContent });
            }
        });

        try {
            let url = apiData.url;
            if (url.endsWith('/')) url = url.slice(0, -1);
            if (!url.endsWith('/chat/completions')) url += '/chat/completions';

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiData.key}`
                },
                body: JSON.stringify({
                    model: apiData.modelName,
                    messages: apiMessages
                })
            });

            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
            
            const result = await response.json();
            let aiReplyRaw = result.choices[0].message.content;
            
            aiReplyRaw = aiReplyRaw.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '').trim();
            
            let messagesArray = [];
            try {
                const jsonMatch = aiReplyRaw.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    messagesArray = JSON.parse(jsonMatch[0]);
                } else {
                    throw new Error('No JSON array found');
                }
            } catch (e) {
                let lines = aiReplyRaw.split('\n').filter(m => m.trim().length > 0);
                messagesArray = lines;
            }

            let innerVoiceTextValue = '';
            // 鏌ユ壘蹇冨０鏍囩
            const heartIndex = messagesArray.findIndex(item => typeof item === 'string' && item.includes('[蹇冨０:'));
            if (heartIndex !== -1) {
                innerVoiceTextValue = messagesArray.splice(heartIndex, 1)[0];
            } else if (messagesArray.length > 0 && String(messagesArray[messagesArray.length - 1]).includes('[鐢熺悊鍙嶅簲:')) {
                innerVoiceTextValue = messagesArray.pop();
            }

            // --- 寮哄埗鎷嗗垎闀垮彞涓庤〃鎯呭寘閫昏緫 ---
            let refinedMessages = [];
            messagesArray.forEach(msg => {
                if (typeof msg !== 'string') {
                    refinedMessages.push(msg);
                    return;
                }
                
                // 澶勭悊娣锋潅鐨勮〃鎯呭寘
                let parts = msg.split(/(\[琛ㄦ儏鍖?.*?\]|\[鍙戦€佸浘鐗?.*?\]|\[杞处:.*?\]|\[璇煶:.*?\])/g);
                
                parts.forEach(part => {
                    part = part.trim();
                    if (!part) return;
                    
                    if (part.match(/^\[(琛ㄦ儏鍖厊鍙戦€佸浘鐗噟杞处|璇煶):/)) {
                        refinedMessages.push(part);
                    } else {
                        // 绾枃瀛楋紝鎸夊彞鍙?鎰熷徆鍙?闂彿/鎹㈣绗︽媶鍒嗘垚鐙珛鐨勭煭鍙ユ皵娉?
                        let sentences = part.split(/([銆傦紒锛焅n]+)/g);
                        let currentSentence = '';
                        
                        for (let i = 0; i < sentences.length; i++) {
                            let s = sentences[i];
                            if (s.match(/^[銆傦紒锛焅n]+$/)) {
                                currentSentence += s.replace(/\n/g, ''); 
                                if (currentSentence.trim()) {
                                    refinedMessages.push(currentSentence.trim());
                                    currentSentence = '';
                                }
                            } else {
                                currentSentence += s;
                            }
                        }
                        if (currentSentence.trim()) {
                            refinedMessages.push(currentSentence.trim());
                        }
                    }
                });
            });
            messagesArray = refinedMessages;

            // 鑷姩鎬荤粨璁板繂瑙﹀彂
            let autoEnabled = JSON.parse(localStorage.getItem('chat_auto_mem_enabled') || '{}');
            let autoThresholds = JSON.parse(localStorage.getItem('chat_auto_mem_thresholds') || '{}');
            if (autoEnabled[currentActiveContactId]) {
                const threshold = autoThresholds[currentActiveContactId] || 100;
                let chatMemories = JSON.parse(localStorage.getItem('chat_memories') || '{}');
                let memories = chatMemories[currentActiveContactId] || [];
                let lastSummaryIndex = memories.length > 0 ? memories[memories.length - 1].toIndex : 0;
                let currentTotalMsgs = messagesData[currentActiveContactId].length;
                
                if (currentTotalMsgs - lastSummaryIndex >= threshold) {
                    if (window.triggerAutoMemorySummary) {
                        window.triggerAutoMemorySummary(currentActiveContactId, lastSummaryIndex, currentTotalMsgs);
                    }
                }
            }

            // 鏌ユ壘鐘舵€佹爣绛?
            const stateIndex = messagesArray.findIndex(item => typeof item === 'string' && item.includes('[鐘舵€?'));
            let newStateStr = '鍦ㄧ嚎';
            if (stateIndex !== -1) {
                const stateStr = messagesArray.splice(stateIndex, 1)[0];
                let statusMatch = stateStr.match(/鐘舵€?(.*?)\]/);
                if (statusMatch) {
                    newStateStr = statusMatch[1].replace(']', '').trim();
                }
            } else if (messagesArray.length > 0 && String(messagesArray[0]).includes('鐘舵€?')) {
                const stateStr = messagesArray.shift();
                let statusMatch = stateStr.match(/鐘舵€?(.*?)\]/);
                if (statusMatch) {
                    newStateStr = statusMatch[1].replace(']', '').trim();
                }
            }

            if (statusEl) statusEl.innerText = newStateStr;
            const simpleStatusEl = document.getElementById('conv-simple-status-text');
            if (simpleStatusEl) simpleStatusEl.innerText = newStateStr;
            let prof = roleProfiles[currentActiveContactId] || {};
            prof.lastState = newStateStr;
            if (innerVoiceTextValue) {
                prof.lastInnerVoice = innerVoiceTextValue;
                // 瀹炴椂鏇存柊蹇冨０鍗＄墖 (濡傛灉宸叉墦寮€)
                if (typeof renderInnerVoice === 'function' && document.getElementById('inner-voice-modal').style.display === 'flex') {
                    renderInnerVoice(innerVoiceTextValue);
                }
            }
            roleProfiles[currentActiveContactId] = prof;
            safeSetItem('chat_role_profiles', JSON.stringify(roleProfiles));

            if (statusDot) statusDot.style.backgroundColor = '#ccc';

            // 娓呯悊绌烘秷鎭拰鍙兘娣锋潅鐨勬爣绛?
            messagesArray = messagesArray.filter(m => {
                if (typeof m !== 'string') return true;
                const clean = m.replace(/\[鐘舵€?.*?\]/g, '').replace(/\[蹇冨０:.*?\]/g, '').trim();
                return clean.length > 0;
            });

            const sendNextMessage = (index) => {
                if (index >= messagesArray.length) {
                    chatAiBtn.innerHTML = originalIcon;
                    chatAiBtn.disabled = false;
                    const currentProf = roleProfiles[currentActiveContactId] || {};
                    if (statusEl) statusEl.innerText = currentProf.lastState || '鍦ㄧ嚎';
                    const simpleStatusEl = document.getElementById('conv-simple-status-text');
                    if (simpleStatusEl) simpleStatusEl.innerText = currentProf.lastState || '鍦ㄧ嚎';
                    return;
                }

                let msgText = messagesArray[index];
                if (typeof msgText !== 'string') {
                    msgText = JSON.stringify(msgText);
                }
                
                // 鍘婚櫎鎵€鏈夊彲鑳芥贩鍏ョ殑鐘舵€佸墠缂€
                msgText = msgText.replace(/^\[?鐘舵€乕:锛歖.*?\]?\s*/i, '');
                msgText = msgText.replace(/\[鐘舵€?.*?\]/g, '').replace(/\[蹇冨０:.*?\]/g, '').trim();
                
                if (!msgText) {
                    sendNextMessage(index + 1);
                    return;
                }
                
                let isStickerOnly = false;
                if (boundStickers.length > 0) {
                    let matchSticker = msgText.match(/^\[琛ㄦ儏鍖?(.*?)\]$/);
                    if (matchSticker) {
                        const name = matchSticker[1];
                        const sticker = boundStickers.find(s => s.name === name);
                        if (sticker) {
                            isStickerOnly = true;
                            msgText = `<img src="${sticker.url}" alt="[琛ㄦ儏鍖?${sticker.name}]" class="chat-sent-image">`;
                        }
                    } else {
                        msgText = msgText.replace(/\[琛ㄦ儏鍖?(.*?)\]/g, (match, name) => {
                            const sticker = boundStickers.find(s => s.name === name);
                            if (sticker) {
                                return `<img src="${sticker.url}" alt="[琛ㄦ儏鍖?${sticker.name}]" style="max-width:120px; border-radius:8px;">`;
                            }
                            return match;
                        });
                    }
                }
                
                let sendImgMatch = msgText.match(/^\[鍙戦€佸浘鐗?(.*?)\]$/);
                if (sendImgMatch) {
                    if (window.handleAIGenerateImage) {
                        window.handleAIGenerateImage(sendImgMatch[1], (imgMsg) => {
                            sendMsg('them', imgMsg);
                        });
                    } else {
                        sendMsg('them', msgText);
                    }
                } else {
                    sendMsg('them', msgText);
                }

                if (index < messagesArray.length - 1) {
                    if (statusEl) statusEl.innerText = '姝ｅ湪杈撳叆涓?..';
                    const simpleStatusEl = document.getElementById('conv-simple-status-text');
                    if (simpleStatusEl) simpleStatusEl.innerText = '姝ｅ湪杈撳叆涓?..';
                    setTimeout(() => {
                        const currentProf = roleProfiles[currentActiveContactId] || {};
                        if (statusEl) statusEl.innerText = currentProf.lastState || '鍦ㄧ嚎';
                        if (simpleStatusEl) simpleStatusEl.innerText = currentProf.lastState || '鍦ㄧ嚎';
                        setTimeout(() => sendNextMessage(index + 1), 500);
                    }, 1000 + Math.random() * 1000);
                } else {
                    const currentProf = roleProfiles[currentActiveContactId] || {};
                    if (statusEl) statusEl.innerText = currentProf.lastState || '鍦ㄧ嚎';
                    const simpleStatusEl = document.getElementById('conv-simple-status-text');
                    if (simpleStatusEl) simpleStatusEl.innerText = currentProf.lastState || '鍦ㄧ嚎';
                    chatAiBtn.innerHTML = originalIcon;
                    chatAiBtn.disabled = false;
                }
            };

            if (messagesArray.length > 0) {
                // 濡傛灉姝ゆ椂宸茬粡鍦ㄥ悗鍙颁簡锛屾垜浠纭繚涓嶄緷璧?setTimeout 琚寕璧?
                if (document.visibilityState === 'hidden') {
                    // 鍚庡彴鏆村姏閫愭潯鍙戯紝涓嶇敤鐪熷疄鐨?setTimeout 鍔ㄧ敾寤惰繜
                    messagesArray.forEach((m, idx) => {
                        let text = typeof m === 'string' ? m : JSON.stringify(m);
                        text = text.replace(/^\[?鐘舵€乕:锛歖.*?\]?\s*/i, '');
                        text = text.replace(/\[鐘舵€?.*?\]/g, '').replace(/\[蹇冨０:.*?\]/g, '').trim();
                        if (text) sendMsg('them', text, currentActiveContactId);
                    });
                    chatAiBtn.innerHTML = originalIcon;
                    chatAiBtn.disabled = false;
                } else {
                    sendNextMessage(0);
                }
            } else {
                chatAiBtn.innerHTML = originalIcon;
                chatAiBtn.disabled = false;
            }

        } catch (error) {
            console.error('API Call Error:', error);
            alert('AI 鍥炲澶辫触: ' + error.message);
            if (statusEl) statusEl.innerText = '鍦ㄧ嚎';
            const simpleStatusEl = document.getElementById('conv-simple-status-text');
            if (simpleStatusEl) simpleStatusEl.innerText = '鍦ㄧ嚎';
        } finally {
            chatAiBtn.innerHTML = originalIcon;
            chatAiBtn.disabled = false;
        }
    });

    convMsgInput.addEventListener('focus', hideAllDrawers);

    // 澶村儚鐐瑰嚮蹇冨０ (鐜板湪鏀逛负鏀惧ぇ闀滃浘鏍囪Е鍙戝脊绐?
    const weiboSearchBtn = document.getElementById('weibo-search-btn');
    const innerVoiceModal = document.getElementById('inner-voice-modal');
    const closeInnerVoiceBtn = document.getElementById('close-inner-voice-btn');
    const refreshInnerVoiceBtn = document.getElementById('refresh-inner-voice-btn');
    const innerVoiceText = document.getElementById('inner-voice-text');

    const renderInnerVoice = (text) => {
        if (!text) {
            innerVoiceText.innerHTML = '<div style="text-align:center; color:#888; font-size:13px; padding:20px 0;">鏈帰娴嬪埌蹇冨０锛岀偣鍑讳笅鏂规寜閽皾璇曡幏鍙?..</div>';
            return;
        }
        
        const parseSection = (label, fullText) => {
            const regex = new RegExp(`\\[${label}:\\s*([^\\]]+)\\]`);
            const match = fullText.match(regex);
            return match ? match[1].trim() : null;
        };

        const physiological = parseSection('鐢熺悊鍙嶅簲', text);
        const eroticThoughts = parseSection('鑹茶壊鎯虫硶', text);
        const dailyThoughts = parseSection('鏃ュ父鎯虫硶', text);
        const oldThoughts = parseSection('鎯虫硶', text) || parseSection('鑹茶壊鍐呭/鏃ュ父', text);
        
        let thoughts = eroticThoughts || dailyThoughts || oldThoughts;
        let thoughtsTitle = eroticThoughts ? 'Erotic Thoughts (鑹茶壊鎯虫硶)' : (dailyThoughts ? 'Daily Thoughts (鏃ュ父鎯虫硶)' : 'Inner Thoughts (鍐呭績鎯虫硶)');
        
        const action = parseSection('琛屽姩', text);

        if (physiological || thoughts || action) {
            let html = '';
            if (physiological) html += `<div style="background: rgba(255,105,180,0.1); border-left: 3px solid #ff69b4; padding: 10px 15px; border-radius: 8px; font-size: 13px; color: #333; margin-bottom: 10px;"><strong style="color: #ff69b4; display: block; margin-bottom: 4px; font-size: 11px;">Physiological (鐢熺悊鍙嶅簲)</strong>${physiological}</div>`;
            if (thoughts) html += `<div style="background: rgba(147,112,219,0.1); border-left: 3px solid #9370db; padding: 10px 15px; border-radius: 8px; font-size: 13px; color: #333; margin-bottom: 10px;"><strong style="color: #9370db; display: block; margin-bottom: 4px; font-size: 11px;">${thoughtsTitle}</strong>${thoughts}</div>`;
            if (action) html += `<div style="background: rgba(30,144,255,0.1); border-left: 3px solid #1e90ff; padding: 10px 15px; border-radius: 8px; font-size: 13px; color: #333;"><strong style="color: #1e90ff; display: block; margin-bottom: 4px; font-size: 11px;">Action (琛屽姩)</strong>${action}</div>`;
            innerVoiceText.innerHTML = html;
        } else {
            innerVoiceText.innerHTML = `<div style="background: rgba(0,0,0,0.03); padding: 15px; border-radius: 12px; font-size: 13px; color: #333; line-height: 1.6;">${text}</div>`;
        }
    };

    if (weiboSearchBtn) {
        weiboSearchBtn.addEventListener('click', () => {
            if (innerVoiceModal && currentActiveContactId) {
                innerVoiceModal.style.display = 'flex';
                let prof = roleProfiles[currentActiveContactId] || {};
                let lastVoice = prof.lastInnerVoice;
                if (!lastVoice) {
                    if (refreshInnerVoiceBtn) refreshInnerVoiceBtn.click();
                } else {
                    renderInnerVoice(lastVoice);
                }
            }
        });
    }

    if (closeInnerVoiceBtn) closeInnerVoiceBtn.addEventListener('click', () => { if (innerVoiceModal) innerVoiceModal.style.display = 'none'; });
    
    if (refreshInnerVoiceBtn) {
        refreshInnerVoiceBtn.addEventListener('click', async () => {
            if (!currentActiveContactId) return;
            const contact = contacts.find(c => c.id === currentActiveContactId);
            if (!contact) return;
            
            const originalText = refreshInnerVoiceBtn.innerText;
            refreshInnerVoiceBtn.innerText = '鎺㈡祴涓?..';
            refreshInnerVoiceBtn.disabled = true;
            
            const apiData = JSON.parse(localStorage.getItem('api_settings') || '{}');
            if (!apiData.url || !apiData.key || !apiData.modelName) {
                innerVoiceText.innerText = '璇峰厛閰嶇疆API浠ヨ幏鍙栬鑹插績澹?..';
                refreshInnerVoiceBtn.innerText = originalText;
                refreshInnerVoiceBtn.disabled = false;
                return;
            }
            
            const sysPrompt = `浣犳壆婕旇鑹诧細${contact.name}銆備汉璁撅細${contact.desc || '鏃?}銆傝杈撳嚭浣犳鍒诲唴蹇冪殑鐪熷疄鎯虫硶銆傚繀椤讳弗鏍兼寜鐓ф牸寮忚緭鍑猴細[蹇冨０:[鐢熺悊鍙嶅簲: xxx][鑹茶壊鎯虫硶: xxx 鎴?鏃ュ父鎯虫硶: xxx][琛屽姩: xxx]]銆備笉瑕佹湁浠讳綍澶氫綑鐨勫紑澶寸粨灏俱€傝姹傦細1. 鎯虫硶閮ㄥ垎鏍规嵁鍦烘櫙鍐冲畾杈撳嚭鏍囩 [鑹茶壊鎯虫硶: ...] 鎴?[鏃ュ父鎯虫硶: ...]銆?. 蹇冨０鍐呭蹇呴』閲囩敤瑙掕壊绗竴浜虹О鎻忚堪锛屾繁搴﹀墫鏋愯〃闈㈣瘽璇箣涓嬬殑鐪熷疄蹇冪悊鍜岄殣绉樻鏈涳紝瑕佹湁涓€绉嶇鎺㈠唴蹇冩繁澶勭殑鎰熻锛岀粷涓嶈兘娴呮樉銆俙;
            
            try {
                let url = apiData.url;
                if (url.endsWith('/')) url = url.slice(0, -1);
                if (!url.endsWith('/chat/completions')) url += '/chat/completions';

                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiData.key}` },
                    body: JSON.stringify({
                        model: apiData.modelName,
                        messages: [{ role: 'system', content: sysPrompt }]
                    })
                });
                
                if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
                const result = await response.json();
                let innerVoice = result.choices[0].message.content;
                let prof = roleProfiles[currentActiveContactId] || {};
                prof.lastInnerVoice = innerVoice;
                roleProfiles[currentActiveContactId] = prof;
                safeSetItem('chat_role_profiles', JSON.stringify(roleProfiles));
                renderInnerVoice(innerVoice);
            } catch (error) {
                console.error(error);
                innerVoiceText.innerText = '鎺㈡祴澶辫触: ' + error.message;
            } finally {
                refreshInnerVoiceBtn.innerText = originalText;
                refreshInnerVoiceBtn.disabled = false;
            }
        });
    }

    const convHeaderTitleContainer = document.querySelector('.conv-header-title');
    if (convHeaderTitleContainer) {
        convHeaderTitleContainer.addEventListener('click', (e) => {
            // Check if we're clicking the back button or its children
            if (e.target.closest('#conv-back-btn')) {
                return;
            }
            // If not, trigger the bg upload
            const uploadConvBg = document.getElementById('upload-conv-bg');
            if (uploadConvBg) uploadConvBg.click();
        });
    }

    // 寰崥鍗＄墖鑳屾櫙涓庢枃鏈寔涔呭寲
    if (chatHeaderBgTrigger) {
        chatHeaderBgTrigger.addEventListener('click', (e) => {
            const uploadConvBg = document.getElementById('upload-conv-bg');
            if (uploadConvBg) uploadConvBg.click();
        });
    }

    const uploadConvBg = document.getElementById('upload-conv-bg');
    if (uploadConvBg) {
        uploadConvBg.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            compressImage(file, 1080, 800, 0.7, (dataUrl) => {
                if (dataUrl && currentActiveContactId) {
                    const weiboBgImg = document.getElementById('weibo-bg-img');
                    if (weiboBgImg) weiboBgImg.style.backgroundImage = `url('${dataUrl}')`;
                    let profile = roleProfiles[currentActiveContactId] || {};
                    profile.weiboBg = dataUrl;
                    roleProfiles[currentActiveContactId] = profile;
                    safeSetItem('chat_role_profiles', JSON.stringify(roleProfiles));
                }
            });
        });
    }

    const uploadConvBottomBg = document.getElementById('upload-conv-bottom-bg');
    if (uploadConvBottomBg) {
        uploadConvBottomBg.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            compressImage(file, 1080, 800, 0.7, (dataUrl) => {
                if (dataUrl && currentActiveContactId) {
                    const weiboBottomBgImg = document.getElementById('weibo-bottom-bg-img');
                    if (weiboBottomBgImg) weiboBottomBgImg.style.backgroundImage = `url('${dataUrl}')`;
                    let profile = roleProfiles[currentActiveContactId] || {};
                    profile.weiboBottomBg = dataUrl;
                    roleProfiles[currentActiveContactId] = profile;
                    safeSetItem('chat_role_profiles', JSON.stringify(roleProfiles));
                }
            });
        });
    }

    const weiboStats = document.getElementById('weibo-editable-stats');
    if (weiboStats) {
        weiboStats.addEventListener('blur', () => {
            if (currentActiveContactId) {
                let profile = roleProfiles[currentActiveContactId] || {};
                profile.weiboStats = weiboStats.innerText;
                roleProfiles[currentActiveContactId] = profile;
                safeSetItem('chat_role_profiles', JSON.stringify(roleProfiles));
            }
        });
    }

    const weiboSig = document.getElementById('weibo-editable-signature');
    if (weiboSig) {
        weiboSig.addEventListener('blur', () => {
            if (currentActiveContactId) {
                let profile = roleProfiles[currentActiveContactId] || {};
                profile.weiboSignature = weiboSig.innerText;
                roleProfiles[currentActiveContactId] = profile;
                safeSetItem('chat_role_profiles', JSON.stringify(roleProfiles));
            }
        });
    }

    // 澶村儚鐐瑰嚮浜嬩欢涓嶅啀鏄崲澶村儚锛屾垜浠篃涓嶉渶瑕佸畠浜嗭紙鍘熺増閫昏緫淇濈暀澶囩敤鎴栫Щ闄ゅ潎鍙紝涓嶅啿绐佸洜涓哄厓绱犺闅愯棌锛?
    if(convHeaderAvatar) {
        convHeaderAvatar.addEventListener('click', () => {
        // 鍒涘缓涓€涓殣钘忕殑鏂囦欢涓婁紶杈撳叆妗?
        let fileInput = document.getElementById('temp-avatar-upload');
        if (!fileInput) {
            fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.id = 'temp-avatar-upload';
            fileInput.accept = 'image/*';
            fileInput.style.display = 'none';
            document.body.appendChild(fileInput);
        }
        
        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            compressImage(file, 400, 400, 0.8, (dataUrl) => {
                if (dataUrl && currentActiveContactId) {
                    let roleProfiles = JSON.parse(localStorage.getItem('chat_role_profiles') || '{}');
                    let profile = roleProfiles[currentActiveContactId] || {};
                    profile.customHeaderAvatar = dataUrl;
                    roleProfiles[currentActiveContactId] = profile;
                    safeSetItem('chat_role_profiles', JSON.stringify(roleProfiles));
                    
                    // 鏇存柊UI
                    convHeaderAvatar.style.backgroundImage = `url('${dataUrl}')`;
                    const weiboAvatar = document.getElementById('weibo-avatar-img');
                    if (weiboAvatar) weiboAvatar.style.backgroundImage = `url('${dataUrl}')`;
                }
            });
            // 娓呯┖ value 鍏佽閲嶅閫夊悓涓€寮犲浘
            e.target.value = '';
        };
        
        fileInput.click();
    });
    }

    // 瑙掕壊璇︽儏椤甸€昏緫
    convProfileBtn.addEventListener('click', () => {
        if(!currentActiveContactId) return;
        const contact = contacts.find(c => c.id === currentActiveContactId);
        if(!contact) return;
        
        rpAvatarPreview.style.backgroundImage = `url('${contact.avatar || ''}')`;
        rpNameDisplay.innerText = contact.name;
        rpDescDisplay.innerText = `${contact.gender || '鏈煡'} | ${contact.age || '鏈煡'}`;
        const descEl = document.getElementById('rp-contact-desc');
        descEl.value = contact.desc || '';
        
        // 缁戝畾淇敼鐩戝惉
        isRoleProfileModified = false;
        descEl.addEventListener('input', markRoleProfileModified);
        rpNameDisplay.addEventListener('input', markRoleProfileModified);
        rpWorldbookSelect.addEventListener('change', markRoleProfileModified);
        rpStickerGroupSelect.addEventListener('change', markRoleProfileModified);
        const rmEl = document.getElementById('rp-reply-min');
        if (rmEl) rmEl.addEventListener('input', markRoleProfileModified);
        const rmxEl = document.getElementById('rp-reply-max');
        if (rmxEl) rmxEl.addEventListener('input', markRoleProfileModified);
        const taEl = document.getElementById('rp-time-aware');
        if (taEl) taEl.addEventListener('change', markRoleProfileModified);
        rpUserPersona.addEventListener('input', markRoleProfileModified);
        const ccEl = document.getElementById('rp-custom-css');
        if (ccEl) ccEl.addEventListener('input', markRoleProfileModified);
        
        // 娓叉煋琛ㄦ儏鍖呭垎缁勯€夐」
        rpStickerGroupSelect.innerHTML = '<option value="">涓嶇粦瀹?/option>';
        stickerGroups.forEach(g => {
            const opt = document.createElement('option');
            opt.value = g.id;
            opt.innerText = g.name;
            rpStickerGroupSelect.appendChild(opt);
        });
        
        if (typeof renderWbSelectOptions === 'function') {
            renderWbSelectOptions();
        }

        const profile = roleProfiles[currentActiveContactId] || {};
        rpWorldbookSelect.value = profile.wbId || '';
        rpStickerGroupSelect.value = profile.stickerGroupId || '';
        
        const rmElVal = document.getElementById('rp-reply-min');
        if (rmElVal) rmElVal.value = profile.replyMin || 1;
        const rmxElVal = document.getElementById('rp-reply-max');
        if (rmxElVal) rmxElVal.value = profile.replyMax || 4;
        const taElVal = document.getElementById('rp-time-aware');
        if (taElVal) taElVal.checked = profile.timeAware || false;
        const arElVal = document.getElementById('rp-auto-reply');
        if (arElVal) arElVal.checked = profile.autoReply || false;
        const ariElVal = document.getElementById('rp-auto-reply-interval');
        if (ariElVal) ariElVal.value = profile.autoReplyInterval || 10;

        rpUserPersona.value = profile.userPersona || '';
        const ccElVal = document.getElementById('rp-custom-css');
        if (rpUserHabits) rpUserHabits.value = profile.userHabits || '';
        if (ccElVal) ccElVal.value = profile.customCss || '';
        if (profile.userAvatar) {
            document.getElementById('rp-user-avatar-preview').style.backgroundImage = `url('${profile.userAvatar}')`;
            document.getElementById('rp-user-avatar-preview').innerHTML = '';
        } else {
            document.getElementById('rp-user-avatar-preview').style.backgroundImage = 'none';
            document.getElementById('rp-user-avatar-preview').innerHTML = `<i class='bx bx-camera' style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #999;"></i>`;
        }
        
        roleProfilePage.style.display = 'flex';
    });
    
    if (convHeaderName) {
        convHeaderName.addEventListener('blur', () => {
            if(!currentActiveContactId) return;
            const newName = convHeaderName.innerText.trim();
            if(newName) {
                const contactIndex = contacts.findIndex(c => c.id === currentActiveContactId);
                if(contactIndex !== -1) {
                    contacts[contactIndex].name = newName;
                    localStorage.setItem('chat_contacts', JSON.stringify(contacts));
                    if (rpNameDisplay) rpNameDisplay.innerText = newName;
                    renderContacts();
                    renderChatList();
                }
            }
        });
        
        convHeaderName.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                convHeaderName.blur();
            }
        });
    }

    // 淇敼鍚嶅瓧澶囨敞
    rpNameDisplay.addEventListener('blur', () => {
        if(!currentActiveContactId) return;
        const newName = rpNameDisplay.innerText.trim();
        if(newName) {
            const contactIndex = contacts.findIndex(c => c.id === currentActiveContactId);
            if(contactIndex !== -1) {
                contacts[contactIndex].name = newName;
                localStorage.setItem('chat_contacts', JSON.stringify(contacts));
                convHeaderName.innerText = newName;
                renderContacts();
                renderChatList();
            }
        }
    });
    
    // 鐢ㄦ埛澶村儚涓婁紶
    let tempUserAvatarBase64 = null;
    document.getElementById('upload-user-avatar').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        compressImage(file, 400, 400, 0.8, (dataUrl) => {
            if (!dataUrl) return;
            tempUserAvatarBase64 = dataUrl;
            document.getElementById('rp-user-avatar-preview').style.backgroundImage = `url('${tempUserAvatarBase64}')`;
            document.getElementById('rp-user-avatar-preview').innerHTML = '';
            
            // 鑷姩淇濆瓨澶村儚
            if(currentActiveContactId) {
                let profile = roleProfiles[currentActiveContactId] || {};
                profile.userAvatar = tempUserAvatarBase64;
                roleProfiles[currentActiveContactId] = profile;
                safeSetItem('chat_role_profiles', JSON.stringify(roleProfiles));
                renderMessages();
            }
        });
    });
    
    // 鑷畾涔夎亰澶╄儗鏅?
    document.getElementById('upload-chat-bg').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        compressImage(file, 800, 1400, 0.6, (bgUrl) => {
            if(!bgUrl) return;
            if(currentActiveContactId) {
                let profile = roleProfiles[currentActiveContactId] || {};
                profile.chatBg = bgUrl;
                roleProfiles[currentActiveContactId] = profile;
                safeSetItem('chat_role_profiles', JSON.stringify(roleProfiles));
                applyChatBackground(bgUrl);
            }
        });
    });
    
    document.getElementById('clear-chat-bg-btn').addEventListener('click', () => {
        if(currentActiveContactId) {
            let profile = roleProfiles[currentActiveContactId] || {};
            profile.chatBg = '';
            roleProfiles[currentActiveContactId] = profile;
            safeSetItem('chat_role_profiles', JSON.stringify(roleProfiles));
            applyChatBackground('');
        }
    });
    
    function applyChatBackground(bgUrl) {
        if(bgUrl) {
            chatConversationPage.style.backgroundImage = `url('${bgUrl}')`;
            chatConversationPage.style.backgroundSize = 'cover';
            chatConversationPage.style.backgroundPosition = 'center';
            chatConversationPage.classList.add('has-custom-bg');
            document.documentElement.style.setProperty('--chat-bg-color', 'transparent');
        } else {
            chatConversationPage.style.backgroundImage = 'none';
            chatConversationPage.style.backgroundColor = '#f8f9fa';
            chatConversationPage.classList.remove('has-custom-bg');
        }
    }
    
    function applyCustomCss(cssText) {
        let styleTag = document.getElementById('chat-custom-css');
        if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = 'chat-custom-css';
            document.head.appendChild(styleTag);
        }
        styleTag.innerHTML = cssText || '';
    }
    
    closeRpBtn.addEventListener('click', () => { 
        if (isRoleProfileModified) {
            if (!confirm('鎮ㄦ湁鏈繚瀛樼殑淇敼锛岀‘瀹氳閫€鍑哄悧锛?)) {
                return;
            }
        }
        roleProfilePage.style.display = 'none'; 
    });
    
    saveRpBtn.addEventListener('click', () => {
        if(!currentActiveContactId) return;

        const contactIndex = contacts.findIndex(c => c.id === currentActiveContactId);
        if (contactIndex !== -1) {
            contacts[contactIndex].desc = document.getElementById('rp-contact-desc').value.trim();
            localStorage.setItem('chat_contacts', JSON.stringify(contacts));
        }

        let profile = roleProfiles[currentActiveContactId] || {};
        profile.wbId = rpWorldbookSelect.value;
        profile.stickerGroupId = rpStickerGroupSelect.value;
        const rmElSave = document.getElementById('rp-reply-min');
        if (rmElSave) profile.replyMin = parseInt(rmElSave.value, 10) || 1;
        const rmxElSave = document.getElementById('rp-reply-max');
        if (rmxElSave) profile.replyMax = parseInt(rmxElSave.value, 10) || 4;
        const taElSave = document.getElementById('rp-time-aware');
        if (taElSave) profile.timeAware = taElSave.checked;
        const arElSave = document.getElementById('rp-auto-reply');
        if (arElSave) profile.autoReply = arElSave.checked;
        const ariElSave = document.getElementById('rp-auto-reply-interval');
        if (ariElSave) profile.autoReplyInterval = parseInt(ariElSave.value, 10) || 10;
        profile.userPersona = rpUserPersona.value.trim();
        const ccElSave = document.getElementById('rp-custom-css');
        if (rpUserHabits) profile.userHabits = rpUserHabits.value.trim();
        if (ccElSave) profile.customCss = ccElSave.value;
        
        roleProfiles[currentActiveContactId] = profile;
        safeSetItem('chat_role_profiles', JSON.stringify(roleProfiles));
        
        applyCustomCss(profile.customCss);
        isRoleProfileModified = false;
        alert('淇濆瓨鎴愬姛');
        // 淇濆瓨鍚庝笉寮哄埗鍏抽棴锛屽厑璁哥户缁紪杈?
    });

    const clearChatBtn = document.getElementById('clear-chat-btn');
    if (clearChatBtn) {
        clearChatBtn.addEventListener('click', () => {
            if (!currentActiveContactId) return;
            if (confirm('纭畾瑕佹竻绌轰笌璇ヨ鑹茬殑鎵€鏈夎亰澶╄褰曞悧锛熸鎿嶄綔涓嶅彲鎭㈠锛?)) {
                messagesData[currentActiveContactId] = [];
                localStorage.setItem('chat_messages', JSON.stringify(messagesData));
                renderMessages();
                alert('鑱婂ぉ璁板綍宸叉竻绌?);
            }
        });
    }

    // 琛ㄦ儏鍖呯鐞嗛〉闈㈤€昏緫
    let isStickerMgrMode = false;
    let selectedStickersForMgr = new Set();
    const batchMgrBtn = document.getElementById('batch-mgr-btn');
    const mgrCancelBtn = document.getElementById('mgr-cancel-btn');
    const mgrMoveSelect = document.getElementById('mgr-move-select');
    const mgrMoveBtn = document.getElementById('mgr-move-btn');
    const mgrDelBtn = document.getElementById('mgr-del-btn');
    const wbContentArea = document.querySelector('#sticker-mgr-page .wb-content-area');
    const stickerMgrBottomBar = document.getElementById('sticker-mgr-bottom-bar');

    if (batchMgrBtn) {
        batchMgrBtn.addEventListener('click', () => {
            isStickerMgrMode = true;
            selectedStickersForMgr.clear();
            if (wbContentArea) wbContentArea.classList.add('mgr-mode-active');
            if (stickerMgrBottomBar) stickerMgrBottomBar.style.display = 'flex';
            
            // 鏇存柊绉诲姩鍒嗙粍鐨勪笅鎷夊垪琛?
            if (mgrMoveSelect) {
                mgrMoveSelect.innerHTML = '<option value="">绉诲姩鍒?..</option>';
                stickerGroups.forEach(g => {
                    if (g.id !== currentStickerGroupId) {
                        const opt = document.createElement('option');
                        opt.value = g.id;
                        opt.innerText = g.name;
                        mgrMoveSelect.appendChild(opt);
                    }
                });
            }
        });
    }

    if (mgrCancelBtn) {
        mgrCancelBtn.addEventListener('click', () => {
            isStickerMgrMode = false;
            selectedStickersForMgr.clear();
            if (wbContentArea) wbContentArea.classList.remove('mgr-mode-active');
            if (stickerMgrBottomBar) stickerMgrBottomBar.style.display = 'none';
            renderStickerMgrGrid(); // 閲嶆柊娓叉煋鍙栨秷閫変腑鐘舵€?
        });
    }

    if (mgrDelBtn) {
        mgrDelBtn.addEventListener('click', () => {
            if (selectedStickersForMgr.size === 0) return;
            if (!confirm(`纭畾瑕佸垹闄ら€変腑鐨?${selectedStickersForMgr.size} 涓〃鎯呭寘鍚楋紵`)) return;
            
            const group = stickerGroups.find(g => g.id === currentStickerGroupId);
            if (group) {
                // filter out the selected indices
                group.stickers = group.stickers.filter((_, idx) => !selectedStickersForMgr.has(idx));
                safeSetItem('chat_sticker_groups', JSON.stringify(stickerGroups));
                
                isStickerMgrMode = false;
                selectedStickersForMgr.clear();
                if (wbContentArea) wbContentArea.classList.remove('mgr-mode-active');
                renderStickerMgrGrid();
            }
        });
    }

    if (mgrMoveBtn) {
        mgrMoveBtn.addEventListener('click', () => {
            if (selectedStickersForMgr.size === 0) return;
            const targetGroupId = mgrMoveSelect.value;
            if (!targetGroupId) { alert('璇峰厛閫夋嫨瑕佺Щ鍔ㄥ埌鐨勭洰鏍囧垎缁?); return; }
            
            const sourceGroup = stickerGroups.find(g => g.id === currentStickerGroupId);
            const targetGroup = stickerGroups.find(g => g.id === targetGroupId);
            
            if (sourceGroup && targetGroup) {
                const stickersToMove = sourceGroup.stickers.filter((_, idx) => selectedStickersForMgr.has(idx));
                targetGroup.stickers.push(...stickersToMove);
                sourceGroup.stickers = sourceGroup.stickers.filter((_, idx) => !selectedStickersForMgr.has(idx));
                
                safeSetItem('chat_sticker_groups', JSON.stringify(stickerGroups));
                
                isStickerMgrMode = false;
                selectedStickersForMgr.clear();
                if (wbContentArea) wbContentArea.classList.remove('mgr-mode-active');
                renderStickerMgrGrid();
                alert(`鎴愬姛灏?${stickersToMove.length} 涓〃鎯呯Щ鍔ㄥ埌 "${targetGroup.name}" 鍒嗙粍`);
            }
        });
    }

    drawerBtnStickers.addEventListener('click', () => {
        hideAllDrawers();
        isStickerMgrMode = false;
        if (wbContentArea) wbContentArea.classList.remove('mgr-mode-active');
        renderStickerMgrTabs();
        stickerMgrPage.style.display = 'flex';
    });

    closeStickerMgrBtn.addEventListener('click', () => {
        stickerMgrPage.style.display = 'none';
    });

    createStickerGroupBtn.addEventListener('click', () => {
        const name = prompt('璇疯緭鍏ヨ〃鎯呭寘鍒嗙粍鍚嶇О:');
        if(name && name.trim()) {
            const newGroup = { id: 'sg_' + Date.now(), name: name.trim(), stickers: [] };
            stickerGroups.push(newGroup);
            safeSetItem('chat_sticker_groups', JSON.stringify(stickerGroups));
            currentStickerGroupId = newGroup.id;
            renderStickerMgrTabs();
        }
    });

    const uploadStickerTxt = document.getElementById('upload-sticker-txt');
    importStickerTxtBtn.addEventListener('click', () => {
        if (!currentStickerGroupId) {
            alert('璇峰厛鍒涘缓鎴栭€夋嫨涓€涓垎缁?);
            return;
        }
        if (uploadStickerTxt) uploadStickerTxt.click();
    });

    if (uploadStickerTxt) {
        uploadStickerTxt.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target.result;
                const group = stickerGroups.find(g => g.id === currentStickerGroupId);
                if(!group) return;

                const lines = text.split('\n');
                let added = 0;
                lines.forEach(line => {
                    line = line.trim();
                    if(!line) return;
                    
                    const httpIndex = line.indexOf('http');
                    if (httpIndex !== -1) {
                        let name = line.substring(0, httpIndex).trim();
                        name = name.replace(/[:锛歕s]+$/, '');
                        const url = line.substring(httpIndex).trim();
                        
                        if (url.startsWith('http')) {
                            if (!name) name = '琛ㄦ儏' + (group.stickers.length + added + 1);
                            group.stickers.push({ name, url });
                            added++;
                        }
                    }
                });
                
                if(added > 0) {
                    safeSetItem('chat_sticker_groups', JSON.stringify(stickerGroups));
                    renderStickerMgrGrid();
                    alert(`鎴愬姛瀵煎叆 ${added} 涓〃鎯呭寘锛乣);
                } else {
                    alert('鏈兘瑙ｆ瀽鍒扮鍚堟牸寮忕殑鏁版嵁銆傜‘淇漈XT姣忚鍖呭惈 http 鎴?https 閾炬帴銆?);
                }
                e.target.value = '';
            };
            reader.readAsText(file);
        });
    }

    function renderStickerMgrTabs() {
        stickerMgrTabs.innerHTML = '';
        if(stickerGroups.length === 0) {
            stickerMgrGrid.innerHTML = '';
            stickerMgrEmpty.style.display = 'flex';
            addStickersBtn.style.display = 'none';
            return;
        }
        
        if(!currentStickerGroupId && stickerGroups.length > 0) {
            currentStickerGroupId = stickerGroups[0].id;
        }

        stickerGroups.forEach(group => {
            const tab = document.createElement('div');
            tab.className = `sticker-tab ${group.id === currentStickerGroupId ? 'active' : ''}`;
            tab.innerText = group.name;
            tab.addEventListener('click', () => {
                currentStickerGroupId = group.id;
                renderStickerMgrTabs();
            });
            stickerMgrTabs.appendChild(tab);
        });
        
        renderStickerMgrGrid();
    }

    function renderStickerMgrGrid() {
        stickerMgrGrid.innerHTML = '';
        const group = stickerGroups.find(g => g.id === currentStickerGroupId);
        
        if(!group) return;
        
        if (addStickersBtn) addStickersBtn.style.display = 'block';
        if (batchMgrBtn) batchMgrBtn.style.display = group.stickers.length > 0 ? 'block' : 'none';
        
        if(group.stickers.length === 0) {
            stickerMgrEmpty.style.display = 'flex';
        } else {
            stickerMgrEmpty.style.display = 'none';
            group.stickers.forEach((s, idx) => {
                const wrapper = document.createElement('div');
                wrapper.className = 'sticker-item-wrapper';
                
                const img = document.createElement('div');
                img.className = 'sticker-img';
                img.style.backgroundImage = `url('${s.url}')`;
                img.title = s.name;
                
                const checkbox = document.createElement('div');
                checkbox.className = 'sticker-checkbox';
                if (selectedStickersForMgr.has(idx)) {
                    checkbox.classList.add('checked');
                    wrapper.classList.add('selected');
                }

                wrapper.appendChild(img);
                wrapper.appendChild(checkbox);

                wrapper.addEventListener('click', () => {
                    if (isStickerMgrMode) {
                        if (selectedStickersForMgr.has(idx)) {
                            selectedStickersForMgr.delete(idx);
                            checkbox.classList.remove('checked');
                            wrapper.classList.remove('selected');
                        } else {
                            selectedStickersForMgr.add(idx);
                            checkbox.classList.add('checked');
                            wrapper.classList.add('selected');
                        }
                    } else {
                        // 鍦ㄩ潪绠＄悊妯″紡涓嬬偣鍑诲浘鐗囧彲浠ヨ繘琛屽叾浠栨搷浣?濡傛灉闇€瑕佺殑璇?锛屽綋鍓嶄负浜嗛伩鍏嶈瑙﹀彲浠ヤ笉鍋氫换浣曚簨锛屾垨鑰呭彲浠ュ崟寮犲垹闄?
                    }
                });
                
                stickerMgrGrid.appendChild(wrapper);
            });
        }
    }

    addStickersBtn.addEventListener('click', () => {
        const text = prompt('璇风矘璐磋〃鎯呭寘鏂囨湰 (鏀寔鏅鸿兘璇嗗埆, 姣忚涓€涓?:');
        if(!text) return;
        
        const group = stickerGroups.find(g => g.id === currentStickerGroupId);
        if(!group) return;

        const lines = text.split('\n');
        let added = 0;
        lines.forEach(line => {
            line = line.trim();
            if(!line) return;
            
            const httpIndex = line.indexOf('http');
            if (httpIndex !== -1) {
                let name = line.substring(0, httpIndex).trim();
                // 鍓旈櫎鏈熬鐨勪腑鑻辨枃鍐掑彿鎴栧浣欑┖鏍?
                name = name.replace(/[:锛歕s]+$/, '');
                
                const url = line.substring(httpIndex).trim();
                
                if (url.startsWith('http')) {
                    if (!name) name = '琛ㄦ儏' + (group.stickers.length + added + 1);
                    group.stickers.push({ name, url });
                    added++;
                }
            }
        });
        
        if(added > 0) {
            safeSetItem('chat_sticker_groups', JSON.stringify(stickerGroups));
            renderStickerMgrGrid();
            alert(`鎴愬姛瀵煎叆 ${added} 涓〃鎯呭寘锛乣);
        } else {
            alert('鏈兘瑙ｆ瀽鍒扮鍚堟牸寮忕殑鏁版嵁銆傜‘淇濇瘡琛屽寘鍚?http 鎴?https 閾炬帴銆?);
        }
    });

    // 鑱婂ぉ搴曢儴鐨勮〃鎯呭寘鎶藉眽娓叉煋
    function renderChatStickerDrawer() {
        stickerDrawerTabs.innerHTML = '';
        stickerDrawerGrid.innerHTML = '';
        
        if(stickerGroups.length === 0) {
            stickerDrawerGrid.innerHTML = '<div style="grid-column:1/-1; text-align:center; color:#888; margin-top:20px;">鏆傛棤琛ㄦ儏鍖咃紝璇风偣鍑诲乏涓嬭+鍙疯繘鍏ョ鐞嗘坊鍔?/div>';
            return;
        }

        let activeGroupId = stickerGroups[0].id;
        for (let g of stickerGroups) {
            if (g.stickers && g.stickers.length > 0) {
                activeGroupId = g.id;
                break;
            }
        }

        const renderGrid = (groupId) => {
            stickerDrawerGrid.innerHTML = '';
            const g = stickerGroups.find(x => x.id === groupId);
            if(!g || g.stickers.length === 0) return;
            g.stickers.forEach(s => {
                const wrapper = document.createElement('div');
                wrapper.className = 'sticker-item-wrapper';
                const img = document.createElement('div');
                img.className = 'sticker-img';
                img.style.backgroundImage = `url('${s.url}')`;
                wrapper.appendChild(img);
                wrapper.addEventListener('click', () => {
                    // 鍙戦€佸甫鏈?alt 鏍囩鐨?img 鏍囩锛屾柟渚緼I璇嗗埆
                    sendMsg('me', `<img src="${s.url}" alt="[琛ㄦ儏鍖?${s.name}]" style="max-width:120px; border-radius:8px;">`);
                    hideAllDrawers();
                });
                stickerDrawerGrid.appendChild(wrapper);
            });
        };

        stickerGroups.forEach((group, index) => {
            const tab = document.createElement('div');
            tab.className = `sticker-tab ${group.id === activeGroupId ? 'active' : ''}`;
            tab.innerText = group.name;
            tab.addEventListener('click', () => {
                Array.from(stickerDrawerTabs.children).forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                renderGrid(group.id);
            });
            stickerDrawerTabs.appendChild(tab);
        });

        renderGrid(activeGroupId);
    }

    // 璁剧疆涓庝笘鐣屼功鐩稿叧鍏冪礌
    const settingsBtn = document.getElementById('nav-item-2');
    const settingsPage = document.getElementById('settings-page');
    const closeSettingsBtn = document.getElementById('close-settings-btn');
    
    const navApiSettings = document.getElementById('nav-api-settings');
    const apiSettingsPage = document.getElementById('api-settings-page');
    const closeApiSettingsBtn = document.getElementById('close-api-settings-btn');
    const saveApiBtn = document.getElementById('save-api-btn');
    
    const worldBookBtn = document.getElementById('app-item-2');
    const worldBookPage = document.getElementById('worldbook-page');
    const closeWbBtn = document.getElementById('close-wb-btn');
    const wbNavBtns = document.querySelectorAll('.wb-nav-btn');
    const wbGlobalGrid = document.getElementById('wb-global-grid');
    const wbLocalGrid = document.getElementById('wb-local-grid');
    const wbHeaderTitle = document.getElementById('wb-header-title');
    
    const wbAddModal = document.getElementById('wb-add-modal');
    const wbAddContentBtn = document.getElementById('wb-add-content-btn');
    const closeWbAddBtn = document.getElementById('close-wb-add-btn');
    
    // API璁剧疆鐩稿叧鍏冪礌
    const fetchModelsBtn = document.getElementById('fetch-models-btn');
    const modelSelectGroup = document.getElementById('model-select-group');
    const apiModelSelect = document.getElementById('api-model-select');
    const apiModelNameInput = document.getElementById('api-model-name');

    const apiPresetSelect = document.getElementById('api-preset-select');
    const apiSavePresetBtn = document.getElementById('api-save-preset-btn');
    const apiDelPresetBtn = document.getElementById('api-del-preset-btn');

    // 鍒濆鍖朅PI璁剧疆鏁版嵁
    const loadApiSettings = () => {
        const apiData = JSON.parse(localStorage.getItem('api_settings') || '{}');
        
        renderApiPresets(apiData);

        apiModelNameInput.value = apiData.modelName || '';
        document.getElementById('api-url').value = apiData.url || '';
        document.getElementById('api-key').value = apiData.key || '';
        
        if (apiData.fetchedModels && apiData.fetchedModels.length > 0) {
            populateModelSelect(apiData.fetchedModels);
            apiModelSelect.value = apiData.selectedModel || '';
            modelSelectGroup.style.display = 'flex';
        }
    };

    function renderApiPresets(apiData) {
        apiPresetSelect.innerHTML = '<option value="">榛樿棰勮</option>';
        if (apiData.presets) {
            Object.keys(apiData.presets).forEach(name => {
                const opt = document.createElement('option');
                opt.value = name;
                opt.innerText = name;
                apiPresetSelect.appendChild(opt);
            });
        }
        apiPresetSelect.value = apiData.currentPreset || '';
    }

    apiPresetSelect.addEventListener('change', (e) => {
        const name = e.target.value;
        const apiData = JSON.parse(localStorage.getItem('api_settings') || '{}');
        if (name && apiData.presets && apiData.presets[name]) {
            const p = apiData.presets[name];
            document.getElementById('api-url').value = p.url || '';
            document.getElementById('api-key').value = p.key || '';
            apiModelNameInput.value = p.modelName || '';
            apiModelSelect.value = p.selectedModel || '';
        } else {
            document.getElementById('api-url').value = '';
            document.getElementById('api-key').value = '';
            apiModelNameInput.value = '';
            apiModelSelect.value = '';
        }
        apiData.currentPreset = name;
        localStorage.setItem('api_settings', JSON.stringify(apiData));
    });

    apiSavePresetBtn.addEventListener('click', () => {
        const name = prompt('璇疯緭鍏ラ璁惧悕绉?');
        if (!name || !name.trim()) return;
        const apiData = JSON.parse(localStorage.getItem('api_settings') || '{}');
        if (!apiData.presets) apiData.presets = {};
        
        let finalModel = apiModelNameInput.value.trim();
        if(!finalModel && apiModelSelect.value) finalModel = apiModelSelect.value;

        apiData.presets[name.trim()] = {
            url: document.getElementById('api-url').value.trim(),
            key: document.getElementById('api-key').value.trim(),
            modelName: finalModel,
            selectedModel: apiModelSelect.value
        };
        apiData.currentPreset = name.trim();
        localStorage.setItem('api_settings', JSON.stringify(apiData));
        renderApiPresets(apiData);
        alert('棰勮淇濆瓨鎴愬姛');
    });

    apiDelPresetBtn.addEventListener('click', () => {
        const name = apiPresetSelect.value;
        if (!name) return;
        const apiData = JSON.parse(localStorage.getItem('api_settings') || '{}');
        if (apiData.presets && apiData.presets[name]) {
            delete apiData.presets[name];
            apiData.currentPreset = '';
            localStorage.setItem('api_settings', JSON.stringify(apiData));
            renderApiPresets(apiData);
        }
    });


    function populateModelSelect(models) {
        apiModelSelect.innerHTML = '<option value="">璇烽€夋嫨妯″瀷...</option>';
        models.forEach(model => {
            const opt = document.createElement('option');
            opt.value = model.id;
            opt.textContent = model.id;
            apiModelSelect.appendChild(opt);
        });
        modelSelectGroup.style.display = 'flex';
    }

    fetchModelsBtn.addEventListener('click', async () => {
        let url = document.getElementById('api-url').value.trim();
        const key = document.getElementById('api-key').value.trim();
        
        if (!url || !key) {
            alert('璇峰厛濉啓URL鍜孉PI绉橀挜');
            return;
        }

        // 瑙勮寖鍖朥RL
        if (url.endsWith('/')) url = url.slice(0, -1);
        if (!url.endsWith('/v1')) url += '/v1';
        const modelsUrl = `${url}/models`;

        const originalHtml = fetchModelsBtn.innerHTML;
        fetchModelsBtn.innerHTML = `<i class='bx bx-loader-alt spin'></i><span>鎷夊彇涓?..</span>`;
        fetchModelsBtn.disabled = true;

        try {
            const response = await fetch(modelsUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${key}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                // Read response text for NAI specific errors
                const errText = await response.text();
                throw new Error(`HTTP error! status: ${response.status} - ${errText}`);
            }
            
            const data = await response.json();
            if (data && data.data && Array.isArray(data.data)) {
                populateModelSelect(data.data);
                // 鑷姩閫夋嫨绗竴涓?
                if(data.data.length > 0) apiModelSelect.value = data.data[0].id;
                
                // 鏆傛椂淇濆瓨鎷夊彇鍒扮殑鍒楄〃鍒版湰鍦板瓨鍌紝浠ヤ究閲嶆柊鎵撳紑鏃惰繕鑳界湅鍒?
                const apiData = JSON.parse(localStorage.getItem('api_settings') || '{}');
                apiData.fetchedModels = data.data;
                localStorage.setItem('api_settings', JSON.stringify(apiData));
            } else {
                throw new Error('杩斿洖鏁版嵁鏍煎紡涓嶆纭?);
            }
        } catch (error) {
            console.error('Fetch models error:', error);
            alert('鎷夊彇妯″瀷澶辫触锛岃妫€鏌RL銆佺閽ユ垨缃戠粶杩炴帴銆俓n閿欒淇℃伅: ' + error.message);
        } finally {
            fetchModelsBtn.innerHTML = originalHtml;
            fetchModelsBtn.disabled = false;
        }
    });

    apiModelSelect.addEventListener('change', () => {
        // 褰撻€夋嫨浜嗕笅鎷夋鐨勬ā鍨嬫椂锛屽悓姝ュ埌鍚嶇О杈撳叆妗?
        if(apiModelSelect.value) {
            apiModelNameInput.value = apiModelSelect.value;
        }
    });

    // 璁剧疆椤甸潰璺敱閫昏緫
    settingsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        homePage.style.display = 'none';
        settingsPage.style.display = 'flex';
    });
    closeSettingsBtn.addEventListener('click', () => {
        settingsPage.style.display = 'none';
        homePage.style.display = 'flex';
    });

    // API璁剧疆椤甸潰閫昏緫
    navApiSettings.addEventListener('click', () => {
        loadApiSettings();
        apiSettingsPage.style.display = 'flex';
    });
    closeApiSettingsBtn.addEventListener('click', () => {
        apiSettingsPage.style.display = 'none';
    });
    saveApiBtn.addEventListener('click', () => {
        // 浼樺厛浣跨敤鎵嬪姩杈撳叆鐨勬ā鍨嬪悕绉帮紝濡傛灉娌℃湁锛屽垯浣跨敤涓嬫媺妗嗛€変腑鐨?
        let finalModel = apiModelNameInput.value.trim();
        if(!finalModel && apiModelSelect.value) {
            finalModel = apiModelSelect.value;
        }

        const currentData = JSON.parse(localStorage.getItem('api_settings') || '{}');
        const apiData = {
            ...currentData,
            modelName: finalModel,
            selectedModel: apiModelSelect.value,
            url: document.getElementById('api-url').value.trim(),
            key: document.getElementById('api-key').value.trim(),
            currentPreset: apiPresetSelect.value
        };
        localStorage.setItem('api_settings', JSON.stringify(apiData));
        apiSettingsPage.style.display = 'none';
        // 涓嶅脊鍑哄師鐢焌lert锛岄潤榛樹繚瀛樼鍚堥煩绯婚珮绾ф劅
    });

    // 涓栫晫涔﹂〉闈㈤€昏緫
    let currentFolderId = null; // 褰撳墠鎵撳紑鐨勬枃浠跺すID锛宯ull琛ㄧず鏍圭洰褰?

    worldBookBtn.addEventListener('click', (e) => {
        e.preventDefault();
        homePage.style.display = 'none';
        worldBookPage.style.display = 'flex';
        currentFolderId = null;
        renderWorldBooks();
    });
    closeWbBtn.addEventListener('click', () => {
        worldBookPage.style.display = 'none';
        homePage.style.display = 'flex';
        currentFolderId = null;
    });

    // 鍒涘缓鏂囦欢澶规寜閽€昏緫
    const wbCreateFolderBtn = document.getElementById('wb-create-folder-btn');
    if (wbCreateFolderBtn) {
        wbCreateFolderBtn.addEventListener('click', () => {
            if (currentFolderId) {
                alert('鏆傛椂涓嶆敮鎸佸湪鏂囦欢澶瑰唴宓屽鍒涘缓鏂囦欢澶?);
                return;
            }
            const folderName = prompt('璇疯緭鍏ユ枃浠跺す鍚嶇О:');
            if (folderName && folderName.trim()) {
                const isGlobal = document.querySelector('.wb-nav-btn[data-target="global"]').classList.contains('active');
                const targetList = isGlobal ? worldBooks.global : worldBooks.local;
                targetList.push({
                    id: 'wb_folder_' + Date.now(),
                    title: folderName.trim(),
                    type: 'folder'
                });
                safeSetItem('chat_worldbooks', JSON.stringify(worldBooks));
                renderWorldBooks();
                if (typeof renderWbSelectOptions === 'function') renderWbSelectOptions();
            }
        });
    }

    const wbBreadcrumb = document.getElementById('wb-breadcrumb');
    const wbBackFolderBtn = document.getElementById('wb-back-folder-btn');
    const wbCurrentFolderName = document.getElementById('wb-current-folder-name');

    if (wbBackFolderBtn) {
        wbBackFolderBtn.addEventListener('click', () => {
            currentFolderId = null;
            renderWorldBooks();
        });
    }

    wbNavBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            wbNavBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFolderId = null; // 鍒囨崲鍏ㄥ眬/灞€閮ㄦ椂閲嶇疆鍒版牴鐩綍
            const target = btn.dataset.target;
            if(target === 'global') {
                wbGlobalGrid.style.display = 'grid';
                wbLocalGrid.style.display = 'none';
                wbHeaderTitle.innerText = '鍏ㄥ眬';
            } else {
                wbGlobalGrid.style.display = 'none';
                wbLocalGrid.style.display = 'grid';
                wbHeaderTitle.innerText = '灞€閮?;
            }
            renderWorldBooks();
        });
    });

    function renderWorldBooks() {
        wbGlobalGrid.innerHTML = '';
        wbLocalGrid.innerHTML = '';
        const isGlobal = document.querySelector('.wb-nav-btn[data-target="global"]').classList.contains('active');
        const listToRender = isGlobal ? worldBooks.global : worldBooks.local;
        const targetGrid = isGlobal ? wbGlobalGrid : wbLocalGrid;
        
        let displayList = [];
        if (currentFolderId) {
            displayList = listToRender.filter(wb => wb.parentId === currentFolderId && wb.type === 'item');
            const currentFolder = listToRender.find(wb => wb.id === currentFolderId);
            if (wbBreadcrumb) {
                wbBreadcrumb.style.display = 'flex';
                if (wbCurrentFolderName) wbCurrentFolderName.innerText = currentFolder ? currentFolder.title : '鏈煡鏂囦欢澶?;
            }
        } else {
            displayList = listToRender.filter(wb => !wb.parentId);
            if (wbBreadcrumb) wbBreadcrumb.style.display = 'none';
        }

        if (displayList.length === 0) {
            targetGrid.innerHTML = `<div class="empty-state" style="grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; color: #aaa; margin-top: 50px;">
                <i class='bx ${currentFolderId ? 'bx-folder-open' : (isGlobal ? 'bx-book-open' : 'bx-book-bookmark')}' style="font-size: 48px; margin-bottom: 10px;"></i>
                <p>${currentFolderId ? '鏂囦欢澶逛负绌? : (isGlobal ? '鏆傛棤鍏ㄥ眬涓栫晫涔﹀唴瀹? : '鏆傛棤灞€閮ㄤ笘鐣屼功鍐呭')}</p>
            </div>`;
        } else {
            displayList.forEach(wb => {
                const el = document.createElement('div');
                el.className = 'wb-folder-item';
                
                if (wb.type === 'folder') {
                    el.innerHTML = `<i class='bx bxs-folder wb-folder-icon'></i><div class="wb-item-title">${wb.title}</div>`;
                    el.addEventListener('click', () => {
                        currentFolderId = wb.id;
                        renderWorldBooks();
                    });
                } else {
                    el.innerHTML = `<i class='bx bx-file wb-folder-icon' style="color:#d4d4d4;"></i><div class="wb-item-title">${wb.title}</div>`;
                    // 鐐瑰嚮鏉＄洰鏌ョ湅/缂栬緫鍔熻兘鍙互杩欓噷鎵╁睍
                }
                targetGrid.appendChild(el);
            });
        }
    }

    function renderWbSelectOptions() {
        const rpWorldbookSelect = document.getElementById('rp-worldbook-select');
        if (!rpWorldbookSelect) return;
        const currentVal = rpWorldbookSelect.value;
        rpWorldbookSelect.innerHTML = '<option value="">涓嶇粦瀹?/option>';
        
        // 缁戝畾鐨勯€夐」鍙樉绀?folder 鍜?item锛岄€氬父鏀寔缁戝畾鏁翠釜folder
        const allWbs = worldBooks.global.concat(worldBooks.local);
        
        const folders = allWbs.filter(wb => wb.type === 'folder');
        if (folders.length > 0) {
            const group = document.createElement('optgroup');
            group.label = '鏂囦欢澶?(缁戝畾璇ユ枃浠跺す涓嬫墍鏈夊唴瀹?';
            folders.forEach(wb => {
                const opt = document.createElement('option');
                opt.value = wb.id;
                opt.innerText = `馃搧 ${wb.title}`;
                group.appendChild(opt);
            });
            rpWorldbookSelect.appendChild(group);
        }

        const items = allWbs.filter(wb => wb.type === 'item');
        if (items.length > 0) {
            const group = document.createElement('optgroup');
            group.label = '鍗曠嫭鏉＄洰';
            items.forEach(wb => {
                const prefix = wb.parentId ? '馃搫 ' : '馃搫 [鏍圭洰褰昡 ';
                const opt = document.createElement('option');
                opt.value = wb.id;
                opt.innerText = `${prefix}${wb.title}`;
                group.appendChild(opt);
            });
            rpWorldbookSelect.appendChild(group);
        }

        rpWorldbookSelect.value = currentVal;
    }

    // 濉厖娣诲姞鍐呭寮圭獥涓殑鏂囦欢澶归€夋嫨
    function updateAddModalFolderSelect() {
        const wbFolderSelect = document.getElementById('wb-folder-select');
        if (!wbFolderSelect) return;
        wbFolderSelect.innerHTML = '<option value="">鏍圭洰褰?(鏃犳枃浠跺す)</option>';
        const isGlobal = document.querySelector('.wb-nav-btn[data-target="global"]').classList.contains('active');
        const listToRender = isGlobal ? worldBooks.global : worldBooks.local;
        
        const folders = listToRender.filter(wb => wb.type === 'folder');
        folders.forEach(f => {
            const opt = document.createElement('option');
            opt.value = f.id;
            opt.innerText = f.title;
            wbFolderSelect.appendChild(opt);
        });
        
        // 榛樿閫変腑褰撳墠姝ｅ湪娴忚鐨勬枃浠跺す
        if (currentFolderId) {
            wbFolderSelect.value = currentFolderId;
        }
    }

    wbAddContentBtn.addEventListener('click', () => {
        document.getElementById('wb-input-title').value = '';
        document.getElementById('wb-input-content').value = '';
        updateAddModalFolderSelect();
        wbAddModal.style.display = 'flex';
    });
    closeWbAddBtn.addEventListener('click', () => {
        wbAddModal.style.display = 'none';
    });
    document.getElementById('save-wb-btn').addEventListener('click', () => {
        const title = document.getElementById('wb-input-title').value.trim();
        const content = document.getElementById('wb-input-content').value.trim();
        const folderSelect = document.getElementById('wb-folder-select');
        const parentId = folderSelect ? folderSelect.value : '';

        if (!title || !content) {
            alert('鏍囬鍜屽唴瀹逛笉鑳戒负绌?);
            return;
        }
        
        const isGlobal = document.querySelector('.wb-nav-btn[data-target="global"]').classList.contains('active');
        const targetList = isGlobal ? worldBooks.global : worldBooks.local;
        
        const newItem = {
            id: 'wb_' + Date.now(),
            title: title,
            content: content,
            type: 'item'
        };

        if (parentId) {
            newItem.parentId = parentId;
        }
        
        targetList.push(newItem);
        
        safeSetItem('chat_worldbooks', JSON.stringify(worldBooks));
        renderWorldBooks();
        if (typeof renderWbSelectOptions === 'function') renderWbSelectOptions();
        wbAddModal.style.display = 'none';
    });

    // 娓叉煋鑱旂郴浜哄垪琛?
    function renderContacts() {
        const container = document.getElementById('contact-list-container');
        const emptyState = document.getElementById('contacts-empty');
        container.innerHTML = '';
        
        if (contacts.length === 0) {
            emptyState.style.display = 'flex';
        } else {
            emptyState.style.display = 'none';
            contacts.forEach(contact => {
                const item = document.createElement('div');
                item.className = 'contact-item';
                item.style.position = 'relative';
                item.style.overflow = 'hidden';
                item.style.padding = '0';
                
                const inner = document.createElement('div');
                inner.className = 'contact-item-inner';
                inner.style.display = 'flex';
                inner.style.alignItems = 'center';
                inner.style.width = '100%';
                inner.style.padding = '12px 15px';
                inner.style.transition = 'transform 0.3s ease';
                inner.style.position = 'relative';
                inner.style.zIndex = '2';
                inner.style.backgroundColor = '#fff';
                
                inner.innerHTML = `
                    <div class="contact-item-avatar" style="background-image: url('${contact.avatar || ''}')"></div>
                    <div class="contact-item-info">
                        <div class="contact-item-name">${contact.name || '鏈懡鍚?}</div>
                    </div>
                `;
                
                const delBtn = document.createElement('div');
                delBtn.innerText = '鍒犻櫎';
                delBtn.style.position = 'absolute';
                delBtn.style.right = '0';
                delBtn.style.top = '0';
                delBtn.style.height = '100%';
                delBtn.style.width = '70px';
                delBtn.style.backgroundColor = '#ff3b30';
                delBtn.style.color = '#fff';
                delBtn.style.display = 'flex';
                delBtn.style.justifyContent = 'center';
                delBtn.style.alignItems = 'center';
                delBtn.style.fontWeight = 'bold';
                delBtn.style.zIndex = '1';
                delBtn.style.cursor = 'pointer';
                
                delBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if(confirm('纭畾瑕佸垹闄よ瑙掕壊鍙婃墍鏈夎亰澶╄褰曞悧锛熸搷浣滀笉鍙仮澶嶏紒')) {
                        contacts = contacts.filter(c => c.id !== contact.id);
                        chatList = chatList.filter(c => c.contactId !== contact.id);
                        delete messagesData[contact.id];
                        delete roleProfiles[contact.id];
                        localStorage.setItem('chat_contacts', JSON.stringify(contacts));
                        localStorage.setItem('chat_list', JSON.stringify(chatList));
                        localStorage.setItem('chat_messages', JSON.stringify(messagesData));
                        localStorage.setItem('chat_role_profiles', JSON.stringify(roleProfiles));
                        renderContacts();
                        renderChatList();
                    }
                });

                inner.addEventListener('click', () => {
                    openEditContactPage(contact);
                });

                let startX = 0;
                let currentX = 0;
                inner.addEventListener('touchstart', (e) => {
                    startX = e.touches[0].clientX;
                }, {passive: true});
                
                inner.addEventListener('touchmove', (e) => {
                    currentX = e.touches[0].clientX;
                    let diff = startX - currentX;
                    if (diff > 30) {
                        inner.style.transform = 'translateX(-70px)';
                    } else if (diff < -30) {
                        inner.style.transform = 'translateX(0)';
                    }
                }, {passive: true});

                item.appendChild(inner);
                item.appendChild(delBtn);
                container.appendChild(item);
            });
        }
    }

    function openEditContactPage(contact) {
        editingContactId = contact.id;
        document.getElementById('contact-input-name').value = contact.name || '';
        document.getElementById('contact-input-gender').value = contact.gender || '';
        document.getElementById('contact-input-age').value = contact.age || '';
        document.getElementById('contact-input-opening').value = contact.opening || '';
        document.getElementById('contact-input-desc').value = contact.desc || '';
        currentContactAvatarBase64 = contact.avatar || '';
        if (currentContactAvatarBase64) {
            contactAvatarPreview.style.backgroundImage = `url('${currentContactAvatarBase64}')`;
            contactAvatarPreview.classList.add('has-photo');
        } else {
            contactAvatarPreview.style.backgroundImage = 'none';
            contactAvatarPreview.classList.remove('has-photo');
        }
        const deleteContactBtn = document.getElementById('delete-contact-btn');
        if (deleteContactBtn) deleteContactBtn.style.display = 'block';
        addContactPage.style.display = 'flex';
        document.querySelector('.add-contact-header h2').innerText = '缂栬緫浜鸿';
    }

    // 娓叉煋鑱婂ぉ鍒楄〃
    function renderChatList() {
        const container = document.getElementById('chat-list-container');
        const emptyState = document.getElementById('messages-empty');
        container.innerHTML = '';
        
        if (chatList.length === 0) {
            emptyState.style.display = 'flex';
        } else {
            emptyState.style.display = 'none';
            chatList.forEach(chat => {
                const contact = contacts.find(c => c.id === chat.contactId);
                if(!contact) return;
                const item = document.createElement('div');
                item.className = 'contact-item';
                item.innerHTML = `
                    <div class="contact-item-avatar" style="background-image: url('${contact.avatar || ''}')"></div>
                    <div class="contact-item-info">
                        <div class="contact-item-name">${contact.name || '鏈懡鍚?}</div>
                        <div style="font-size:12px; color:#888; margin-top:4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${contact.opening || ''}</div>
                    </div>
                `;
                item.addEventListener('click', () => openConversation(contact));
                container.appendChild(item);
            });
        }
    }

    // 娓叉煋閫夋嫨鑱旂郴浜哄垪琛?
    // 鎵撳紑鑱婂ぉ瀵硅瘽椤甸潰
    function openConversation(contact) {
        currentActiveContactId = contact.id;
        const profile = roleProfiles[contact.id] || {};
        
        // 娓叉煋浠垮井鍗氬ご閮ㄤ俊鎭?
        const weiboAvatar = document.getElementById('weibo-avatar-img');
        if (weiboAvatar) {
            weiboAvatar.style.backgroundImage = profile.customHeaderAvatar ? `url('${profile.customHeaderAvatar}')` : `url('${contact.avatar || ''}')`;
        }
        if (convHeaderAvatar) {
            convHeaderAvatar.style.backgroundImage = profile.customHeaderAvatar ? `url('${profile.customHeaderAvatar}')` : `url('${contact.avatar || ''}')`;
        }
        
        // 鏇存柊閫忔槑澶撮儴淇℃伅
        const simpleName = document.getElementById('conv-simple-name-text');
        if (simpleName) simpleName.innerText = contact.name || '鏈懡鍚?;
        
        const simpleStatusText = document.getElementById('conv-simple-status-text');
        if (simpleStatusText) simpleStatusText.innerText = profile.lastState || '鍦ㄧ嚎 - WiFi';

        const weiboName = document.getElementById('conv-header-name');
        if (weiboName) weiboName.innerText = contact.name || '鏈懡鍚?;
        
        const weiboStatus = document.getElementById('conv-header-status');
        if (weiboStatus) weiboStatus.innerText = profile.lastState || '鍦ㄧ嚎 - WiFi';
        
        // 鎭㈠寰崥鍗＄墖涓€у寲璁剧疆
        const weiboBgImg = document.getElementById('weibo-bg-img');
        if (weiboBgImg) {
            weiboBgImg.style.backgroundImage = profile.weiboBg ? `url('${profile.weiboBg}')` : 'none';
        }

        const weiboBottomBgImg = document.getElementById('weibo-bottom-bg-img');
        if (weiboBottomBgImg) {
            weiboBottomBgImg.style.backgroundImage = profile.weiboBottomBg ? `url('${profile.weiboBottomBg}')` : 'none';
        }

        const weiboStats = document.getElementById('weibo-editable-stats');
        if (weiboStats) {
            weiboStats.innerText = profile.weiboStats || '10 绮変笣    31 鍏虫敞';
        }

        const weiboSig = document.getElementById('weibo-editable-signature');
        if (weiboSig) {
            weiboSig.innerText = profile.weiboSignature || '鍍忔湭鎷嗗皝鐨勬椂宸ぜ鐗?;
        }
        
        // 鍒濆鍖栧浜鸿瀵硅瘽 (濡傛灉娌℃湁璁板綍锛屾妸寮€鍦虹櫧浣滀负绗竴鏉℃秷鎭?
        if (!messagesData[contact.id]) {
            messagesData[contact.id] = [];
            if (contact.opening) {
                messagesData[contact.id].push({
                    sender: 'them',
                    text: contact.opening,
                    time: Date.now()
                });
                localStorage.setItem('chat_messages', JSON.stringify(messagesData));
            }
        }
        
        applyChatBackground(profile.chatBg || '');
        applyCustomCss(profile.customCss || '');

        renderMessages();
        chatConversationPage.style.display = 'flex';
        // 婊氬姩鍒板簳閮?
        setTimeout(() => { convMessagesContainer.scrollTop = convMessagesContainer.scrollHeight; }, 50);
    }

    // 娓叉煋瀵硅瘽娑堟伅
    function renderMessages() {
        if (!currentActiveContactId) return;
        const msgs = messagesData[currentActiveContactId] || [];
        const contact = contacts.find(c => c.id === currentActiveContactId);
        const profile = roleProfiles[currentActiveContactId] || {};
        const avatarUrl = contact ? (contact.avatar || '') : '';
        const userAvatarUrl = profile.userAvatar || '';
        
        convMessagesContainer.innerHTML = '';
        
        // 榛樿鐢ㄦ埛澶村儚 Base64 鎴栧崰浣?
        const defaultUserAvatar = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23fff"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>';

        let lastMsgTime = 0;

        // 杈呭姪鍑芥暟锛氱敓鎴愬井淇￠鏍兼椂闂存埑
        function getWechatTime(timestamp) {
            const now = new Date();
            const msgDate = new Date(timestamp);
            
            const hours = String(msgDate.getHours()).padStart(2, '0');
            const minutes = String(msgDate.getMinutes()).padStart(2, '0');
            const timeStr = `${hours}:${minutes}`;
            
            // 璁＄畻鏃ユ湡宸紓 (娓呴櫎鏃堕棿閮ㄥ垎鍙瘮杈冩棩鏈?
            const zeroNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const zeroMsg = new Date(msgDate.getFullYear(), msgDate.getMonth(), msgDate.getDate());
            const diffDays = (zeroNow - zeroMsg) / (1000 * 60 * 60 * 24);
            
            if (diffDays === 0) {
                // 浠婂ぉ
                return timeStr;
            } else if (diffDays === 1) {
                // 鏄ㄥぉ
                return `鏄ㄥぉ ${timeStr}`;
            } else if (diffDays > 1 && diffDays < 7) {
                // 涓€鍛ㄥ唴鏄剧ず鏄熸湡
                const weekDays = ['鍛ㄦ棩', '鍛ㄤ竴', '鍛ㄤ簩', '鍛ㄤ笁', '鍛ㄥ洓', '鍛ㄤ簲', '鍛ㄥ叚'];
                return `${weekDays[msgDate.getDay()]} ${timeStr}`;
            } else {
                // 涓€鍛ㄤ互涓婃垨璺ㄥ勾
                // 濡傛灉璺ㄥ勾鏄剧ず瀹屾暣鏃ユ湡
                if (now.getFullYear() !== msgDate.getFullYear()) {
                    return `${msgDate.getFullYear()}骞?{msgDate.getMonth() + 1}鏈?{msgDate.getDate()}鏃?${timeStr}`;
                } else {
                    return `${msgDate.getMonth() + 1}鏈?{msgDate.getDate()}鏃?${timeStr}`;
                }
            }
        }

        for (let i = 0; i < msgs.length; i++) {
            const msg = msgs[i];
            const isMe = msg.sender === 'me';
            
            // 鏃堕棿鎴抽€昏緫 (姣忛殧5鍒嗛挓鏄剧ず涓€娆?
            if (msg.time) {
                // 濡傛灉鏄涓€鏉℃秷鎭紝鎴栬€呰窛绂讳笂涓€鏉℃秷鎭秴杩?鍒嗛挓
                if (i === 0 || (msg.time - lastMsgTime > 5 * 60 * 1000)) {
                    const timeRow = document.createElement('div');
                    timeRow.className = 'msg-time-stamp';
                    timeRow.innerText = getWechatTime(msg.time);
                    convMessagesContainer.appendChild(timeRow);
                }
                lastMsgTime = msg.time;
            }
            
            // 鎾ゅ洖鐨勬秷鎭?
            if (msg.recalled) {
                const row = document.createElement('div');
                row.className = 'msg-recalled';
                row.innerText = isMe ? '浣犳挙鍥炰簡涓€鏉℃秷鎭? : `"${contact.name || '瀵规柟'}" 鎾ゅ洖浜嗕竴鏉℃秷鎭痐;
                convMessagesContainer.appendChild(row);
                continue;
            }
            
            // 鍒ゆ柇鏄惁鏄繛缁彂娑堟伅
            let isPrevSame = false;
            if (i > 0) {
                let prev = msgs[i-1];
                if (!prev.recalled && prev.sender === msg.sender) isPrevSame = true;
            }
            let isNextSame = false;
            if (i < msgs.length - 1) {
                let next = msgs[i+1];
                if (!next.recalled && next.sender === msg.sender) isNextSame = true;
            }
            
            const row = document.createElement('div');
            row.className = `msg-row ${isMe ? 'sent' : 'received'}`;
            
            // 杩炵画娑堟伅澶勭悊锛氫笉鏄渶鍚庝竴鏉″垯闅愯棌灏惧反
            if (isNextSame) row.classList.add('hide-tail');
            // 杩炵画娑堟伅澶勭悊锛氫笉鏄涓€鏉″垯闅愯棌澶村儚
            if (isPrevSame) row.classList.add('hide-avatar');

            let quoteHtml = '';
            if (msg.quote) {
                quoteHtml = `<div class="msg-quote">${msg.quote}</div>`;
            }

            let checkboxHtml = `<div class="msg-checkbox ${selectedMsgIndices.has(i) ? 'checked' : ''}" data-index="${i}"></div>`;
            
            let finalUserAvatar = userAvatarUrl || defaultUserAvatar;
            let avatarDisplayUrl = isMe ? finalUserAvatar : avatarUrl;

            let innerHtml = '';
            
            // 瑙ｆ瀽杞处
            let transferMatch = msg.text.match(/^\[杞处:([^\]:]+)(?::([^\]]+))?\]$/);
            let textImgMatch = msg.text.match(/^\[鏂囧瓧鍥?([\s\S]*?)\]$/);
            let giftMatch = msg.text.match(/^\[閫佺ぜ:([^:]+):(\d+):([\s\S]+)\]$/); // [閫佺ぜ:椴滆姳:1:base64]
            let isTransfer = false;
            let isVoice = false;
            let isTextImg = false;
            let isGift = false;
            
            if (transferMatch) {
                isTransfer = true;
                let amount = transferMatch[1];
                let note = transferMatch[2] || '';
                let txStatus = msg.txStatus || 'PENDING'; // PENDING, ACCEPTED, REJECTED
                
                let actionsHtml = '';
                let statusText = isMe ? '绛夊緟瀵规柟鏀舵' : '绛夊緟浣犳敹娆?;
                
                if (txStatus === 'PENDING') {
                    if (!isMe) {
                        actionsHtml = `
                            <div class="ptc-actions">
                                <button class="ptc-btn reject" onclick="handleTransfer(${i}, 'REJECTED'); event.stopPropagation();">Reject</button>
                                <button class="ptc-btn accept" onclick="handleTransfer(${i}, 'ACCEPTED'); event.stopPropagation();">Accept</button>
                            </div>
                        `;
                    }
                } else if (txStatus === 'ACCEPTED') {
                    statusText = '宸叉敹娆?;
                } else if (txStatus === 'REJECTED') {
                    statusText = '宸查€€鍥?;
                }

                innerHtml = `
                    <div class="ptc-card" data-index="${i}">
                        <div class="ptc-header">
                            <i class='bx ${txStatus === 'ACCEPTED' ? 'bx-check-circle' : (txStatus === 'REJECTED' ? 'bx-x-circle' : 'bx-lock-alt')}'></i>
                            <span>${txStatus === 'ACCEPTED' ? 'COMPLETED' : (txStatus === 'REJECTED' ? 'REJECTED' : 'SECURE TRANSFER')}</span>
                        </div>
                        <div class="ptc-body">
                            <div class="ptc-amount">楼${amount}</div>
                            <div class="ptc-status">${statusText}</div>
                            ${note ? `<div class="ptc-note">"${note}"</div>` : ''}
                        </div>
                        ${actionsHtml}
                    </div>
                `;
            } else if (textImgMatch) {
                isTextImg = true;
                let content = textImgMatch[1].replace(/</g, '<').replace(/>/g, '>').replace(/\n/g, '<br>');
                
                innerHtml = `
                    <div class="textimg-msg-container" onclick="this.classList.toggle('revealed')">
                        <div class="msg-bubble textimg-real-content" data-index="${i}" style="min-width: 200px; min-height: 200px; padding-top: 20px;">${content}</div>
                        <div class="text-image-sim textimg-sim-cover">
                            <i class='bx bx-lock-alt' style="font-size: 32px; color: #fff; margin-bottom: 10px;"></i>
                            <span style="font-family: monospace; font-size: 14px; color: #aaa; letter-spacing: 1px;">ENCRYPTED MESSAGE</span>
                        </div>
                    </div>
                `;
            } else if (giftMatch) {
                isGift = true;
                let giftName = giftMatch[1];
                let giftPrice = giftMatch[2];
                let giftImgUrl = giftMatch[3];
                innerHtml = `
                    <div class="gift-msg-card" data-index="${i}">
                        <div class="gift-msg-icon" style="background-image: url('${giftImgUrl}')"></div>
                        <div class="gift-msg-text">閫佸嚭浜?${giftName}</div>
                    </div>
                `;
            } else {
                // 鍓ョ娑堟伅涓彲鑳芥畫鐣欑殑 [鐘舵€?xxx]
                let cleanText = msg.text.replace(/^\[鐘舵€?.*?\]\s*/g, '');
                
                // 瑙ｆ瀽璇煶
                let voiceMatch = cleanText.match(/^\[璇煶:(.*?):(.*?)\]$/);
                if (voiceMatch) {
                    isVoice = true;
                    let text = voiceMatch[1];
                    let duration = parseInt(voiceMatch[2]) || 1;
                    let minW = 70;
                    let maxW = 220;
                    let calculatedWidth = Math.min(maxW, minW + (duration * 6));
                    
                    innerHtml = `
                        <div class="voice-bubble-wrapper" style="display: flex; align-items: center; gap: 8px;">
                            <div class="voice-bubble" style="width: ${calculatedWidth}px;">
                                <i class='bx bx-wifi voice-icon'></i>
                                <span>${duration}"</span>
                            </div>
                            <button class="voice-transcribe-btn" onclick="toggleVoiceText(this); event.stopPropagation();" style="background: rgba(0,0,0,0.05); border: 1px solid #ddd; font-size: 11px; color: #555; cursor: pointer; padding: 3px 6px; border-radius: 6px;">杞枃瀛?/button>
                        </div>
                        <div class="voice-text-result">${text}</div>
                    `;
                } else {
                    let bubbleClass = 'msg-bubble';
                    if (cleanText.match(/^<img.*?class="chat-sent-image".*?>$/)) {
                        bubbleClass = 'msg-bubble msg-bubble-sticker';
                    }
                    innerHtml = `<div class="${bubbleClass}" data-index="${i}">${quoteHtml}${cleanText}</div>`;
                }
            }

            if (isTransfer || isVoice || isGift) {
                row.innerHTML = `
                    ${checkboxHtml}
                    <div class="msg-avatar" style="${avatarDisplayUrl.startsWith('data:image/svg') ? `background-image: url('${avatarDisplayUrl}'); background-color: #bbb; background-size: 80%; background-repeat: no-repeat;` : `background-image: url('${avatarDisplayUrl}')`}"></div>
                    <div class="msg-bubble-col" data-index="${i}" style="position:relative;">${innerHtml}</div>
                `;
            } else {
                row.innerHTML = `
                    ${checkboxHtml}
                    <div class="msg-avatar" style="${avatarDisplayUrl.startsWith('data:image/svg') ? `background-image: url('${avatarDisplayUrl}'); background-color: #bbb; background-size: 80%; background-repeat: no-repeat;` : `background-image: url('${avatarDisplayUrl}')`}"></div>
                    ${innerHtml}
                `;
            }
            
            row.addEventListener('click', (e) => {
                if (isMultiSelectMode) {
                    const cb = row.querySelector('.msg-checkbox');
                    if (selectedMsgIndices.has(i)) {
                        selectedMsgIndices.delete(i);
                        cb.classList.remove('checked');
                    } else {
                        selectedMsgIndices.add(i);
                        cb.classList.add('checked');
                    }
                }
            });

            convMessagesContainer.appendChild(row);
        }
    }

    // 鍙戦€佹秷鎭€昏緫 (鍥炶溅鍙戦€?
    convMsgInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && convMsgInput.value.trim() !== '') {
            const text = convMsgInput.value.trim();
            sendMsg('me', text);
            convMsgInput.value = '';
        }
    });

    // 鐐瑰嚮娑堟伅鍒楄〃鍖哄煙鏀惰捣搴曢儴鎶藉眽
    convMessagesContainer.addEventListener('click', (e) => {
        // 闃叉鐐瑰嚮娑堟伅浣撹Е鍙戯紙鍙€夛紝濡傛灉闇€瑕佺偣鍑绘皵娉′篃鏀惰捣鍙互淇濈暀锛?
        if (!e.target.closest('.msg-bubble') && !e.target.closest('.msg-avatar')) {
            hideAllDrawers();
        }
    });

    // 鍏ㄥ眬鏂规硶鎸傝浇 (鏂囧瓧鍥俱€佽闊充笌杞处浜や簰)
    window.showTextViewer = function(index) {
        // No longer used, text image is directly rendered
    };
    
    const tvModal = document.getElementById('text-viewer-modal');
    const tvBg = document.getElementById('close-text-viewer-bg');
    if(tvBg) tvBg.addEventListener('click', () => { if(tvModal) tvModal.style.display = 'none'; });

    window.toggleVoiceText = function(element) {
        const textResult = element.parentElement.nextElementSibling;
        if(textResult && textResult.classList.contains('voice-text-result')) {
            textResult.classList.toggle('show');
        }
    };
    
    window.handleTransfer = function(index, status) {
        if (!currentActiveContactId) return;
        if (messagesData[currentActiveContactId] && messagesData[currentActiveContactId][index]) {
            messagesData[currentActiveContactId][index].txStatus = status;
            localStorage.setItem('chat_messages', JSON.stringify(messagesData));
            renderMessages();
        }
    };

    function sendMsg(sender, text, targetContactId = currentActiveContactId) {
        if(!targetContactId) return;
        
        // 姣忔鍙戞秷鎭墠閲嶆柊鎷夊彇鏈€鏂版暟鎹紝闃叉澶氱/鍚庡彴瑕嗙洊
        let msgs = JSON.parse(localStorage.getItem('chat_messages') || '{}');
        if(!msgs[targetContactId]) msgs[targetContactId] = [];
        
        const newMsg = {
            sender: sender,
            text: text,
            time: Date.now()
        };
        
        if (sender === 'me' && window.currentQuoteText) {
            newMsg.quote = window.currentQuoteText;
            window.currentQuoteText = '';
            const qArea = document.getElementById('quote-preview-area');
            if (qArea) qArea.style.display = 'none';
        }

        msgs[targetContactId].push(newMsg);
        messagesData = msgs; // 鍚屾鍐呭瓨
        localStorage.setItem('chat_messages', JSON.stringify(messagesData));
        
        // 濡傛灉鍦ㄥ墠鍙颁笖鍦ㄥ綋鍓嶈亰澶╃獥鍙ｏ紝鍒欐覆鏌?DOM
        if (document.visibilityState === 'visible') {
            if (currentActiveContactId === targetContactId) {
                renderMessages();
                const container = document.getElementById('conv-messages-container');
                if (container) setTimeout(() => { container.scrollTop = container.scrollHeight; }, 50);
            }
            // 鏇存柊棣栭〉鐨勮亰澶╁垪琛ㄤ互鏄剧ず鏈€鏂版秷鎭瑙?
            renderChatList();
        } else if (sender === 'them' && ('Notification' in window) && Notification.permission === 'granted') {
            // 濡傛灉鍦ㄥ悗鍙版敹鍒板鏂规秷鎭紝寮哄埗瑙﹀彂绯荤粺閫氱煡
            const contact = contacts.find(c => c.id === targetContactId);
            if (contact) {
                let msgPreview = text.replace(/\[琛ㄦ儏鍖?.*?\]/g, '[鍥剧墖]')
                                     .replace(/\[鍙戦€佸浘鐗?.*?\]/g, '[鍥剧墖]')
                                     .replace(/\[璇煶:.*?:.*?\]/g, '[璇煶]')
                                     .replace(/\[杞处:.*?\]/g, '[杞处]')
                                     .replace(/\[鐘舵€?.*?\]/g, '')
                                     .replace(/\[蹇冨０:.*?\]/g, '')
                                     .trim();
                if (!msgPreview) msgPreview = '[濯掍綋娑堟伅]';
                
                if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.ready.then(reg => {
                        reg.showNotification(contact.name, {
                            body: msgPreview,
                            icon: contact.avatar || '',
                            tag: 'chat-msg-' + targetContactId + '-' + Date.now(),
                            renotify: true
                        });
                    });
                } else {
                    const n = new Notification(contact.name, {
                        body: msgPreview,
                        icon: contact.avatar || ''
                    });
                    n.onclick = () => { window.focus(); n.close(); };
                }
            }
        }
    }

    convBackBtn.addEventListener('click', () => {
        chatConversationPage.style.display = 'none';
        currentActiveContactId = null;
    });

    function renderSelectContacts() {
        const container = document.getElementById('select-contact-list-container');
        const emptyState = document.getElementById('select-contacts-empty');
        container.innerHTML = '';
        
        if (contacts.length === 0) {
            emptyState.style.display = 'flex';
        } else {
            emptyState.style.display = 'none';
            contacts.forEach(contact => {
                const item = document.createElement('div');
                item.className = 'contact-item';
                item.innerHTML = `
                    <div class="contact-item-avatar" style="background-image: url('${contact.avatar || ''}')"></div>
                    <div class="contact-item-info">
                        <div class="contact-item-name">${contact.name || '鏈懡鍚?}</div>
                    </div>
                `;
                item.addEventListener('click', () => {
                    // 娣诲姞鍒拌亰澶╁垪琛?
                    if (!chatList.find(c => c.contactId === contact.id)) {
                        chatList.push({ contactId: contact.id, lastMessageTime: Date.now() });
                        localStorage.setItem('chat_list', JSON.stringify(chatList));
                        renderChatList();
                    }
                    selectContactModal.style.display = 'none';
                });
                container.appendChild(item);
            });
        }
    }

    // 鎵撳紑鑱婂ぉ杞欢
    function switchChatTab(targetId, title) {
        // 鏇存柊瀵艰埅楂樹寒
        chatNavItems.forEach(nav => {
            if (nav.dataset.target === targetId) {
                nav.classList.add('active');
                // 鍒囨崲鍥炬爣鏍峰紡 (瀹炲績/绌哄績)
                const i = nav.querySelector('i');
                if(targetId === 'messages') i.className = 'bx bxs-message-rounded';
                if(targetId === 'contacts') i.className = 'bx bxs-contact';
                if(targetId === 'moments') i.className = 'bx bx-world'; // 鍋囪涓栫晫鍥炬爣浠ｈ〃鏈嬪弸鍦?
            } else {
                nav.classList.remove('active');
                const i = nav.querySelector('i');
                if(nav.dataset.target === 'messages') i.className = 'bx bx-message-rounded';
                if(nav.dataset.target === 'contacts') i.className = 'bx bxs-contact';
                if(nav.dataset.target === 'moments') i.className = 'bx bx-world';
            }
        });

        // 鏇存柊闈㈡澘鏄剧ず
        chatViewPanels.forEach(panel => {
            if (panel.id === `chat-view-${targetId}`) {
                panel.classList.add('active');
            } else {
                panel.classList.remove('active');
            }
        });
        
        // 澶勭悊鐗规畩鐨?鎴戠殑"椤甸潰
        if (targetId === 'mine') {
            const userProfilePage = document.getElementById('user-profile-page');
            if (userProfilePage) userProfilePage.classList.add('active');
            chatHeaderTitle.innerText = '鎴戠殑';
            addFriendBtn.style.display = 'none';
            addContactBtn.style.display = 'none';
        } else {
            const userProfilePage = document.getElementById('user-profile-page');
            if (userProfilePage) userProfilePage.classList.remove('active');
            // 鏇存柊鏍囬
            chatHeaderTitle.innerText = title;
            
            // 鏇存柊鍙充笂瑙掓寜閽樉绀?
            addFriendBtn.style.display = targetId === 'messages' ? 'block' : 'none';
            addContactBtn.style.display = targetId === 'contacts' ? 'block' : 'none';
            
            if (targetId === 'contacts') renderContacts();
            if (targetId === 'messages') renderChatList();
        }
    }

    // 娣诲姞鑱旂郴浜洪〉闈㈤€昏緫
    addContactBtn.addEventListener('click', () => {
        editingContactId = null;
        addContactPage.style.display = 'flex';
        document.querySelector('.add-contact-header h2').innerText = '娣诲姞浜鸿';
        // 娓呯┖琛ㄥ崟
        document.getElementById('contact-input-name').value = '';
        document.getElementById('contact-input-gender').value = '';
        document.getElementById('contact-input-age').value = '';
        document.getElementById('contact-input-opening').value = '';
        document.getElementById('contact-input-desc').value = '';
        contactAvatarPreview.style.backgroundImage = 'none';
        contactAvatarPreview.classList.remove('has-photo');
        currentContactAvatarBase64 = '';
        const deleteContactBtn = document.getElementById('delete-contact-btn');
        if (deleteContactBtn) deleteContactBtn.style.display = 'none';
    });

    const deleteContactBtn = document.getElementById('delete-contact-btn');
    if (deleteContactBtn) {
        deleteContactBtn.addEventListener('click', () => {
            if (editingContactId) {
                if(confirm('纭畾瑕佸垹闄よ瑙掕壊鍙婃墍鏈夎亰澶╄褰曞悧锛熸搷浣滀笉鍙仮澶嶏紒')) {
                    contacts = contacts.filter(c => c.id !== editingContactId);
                    chatList = chatList.filter(c => c.contactId !== editingContactId);
                    delete messagesData[editingContactId];
                    delete roleProfiles[editingContactId];
                    localStorage.setItem('chat_contacts', JSON.stringify(contacts));
                    localStorage.setItem('chat_list', JSON.stringify(chatList));
                    localStorage.setItem('chat_messages', JSON.stringify(messagesData));
                    localStorage.setItem('chat_role_profiles', JSON.stringify(roleProfiles));
                    renderContacts();
                    renderChatList();
                    addContactPage.style.display = 'none';
                    alert('瑙掕壊宸插垹闄?);
                }
            }
        });
    }

    closeAddContactBtn.addEventListener('click', () => {
        addContactPage.style.display = 'none';
    });

    contactAvatarUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            currentContactAvatarBase64 = event.target.result;
            contactAvatarPreview.style.backgroundImage = `url('${currentContactAvatarBase64}')`;
            contactAvatarPreview.classList.add('has-photo');
        };
        reader.readAsDataURL(file);
    });

    saveContactBtn.addEventListener('click', () => {
        const name = document.getElementById('contact-input-name').value.trim();
        if (!name) { alert('璇疯緭鍏ュ鍚?); return; }
        
        if (editingContactId) {
            const contactIndex = contacts.findIndex(c => c.id === editingContactId);
            if (contactIndex !== -1) {
                contacts[contactIndex].name = name;
                contacts[contactIndex].gender = document.getElementById('contact-input-gender').value.trim();
                contacts[contactIndex].age = document.getElementById('contact-input-age').value.trim();
                contacts[contactIndex].opening = document.getElementById('contact-input-opening').value.trim();
                contacts[contactIndex].desc = document.getElementById('contact-input-desc').value.trim();
                contacts[contactIndex].avatar = currentContactAvatarBase64;
            }
        } else {
            const newContact = {
                id: 'c_' + Date.now(),
                name: name,
                gender: document.getElementById('contact-input-gender').value.trim(),
                age: document.getElementById('contact-input-age').value.trim(),
                opening: document.getElementById('contact-input-opening').value.trim(),
                desc: document.getElementById('contact-input-desc').value.trim(),
                avatar: currentContactAvatarBase64
            };
            contacts.push(newContact);
        }
        
        localStorage.setItem('chat_contacts', JSON.stringify(contacts));
        
        renderContacts();
        renderChatList();
        addContactPage.style.display = 'none';
    });

    // 娣诲姞濂藉弸鍒拌亰澶╁垪琛ㄩ€昏緫
    addFriendBtn.addEventListener('click', () => {
        renderSelectContacts();
        selectContactModal.style.display = 'flex';
    });

    closeSelectContactBtn.addEventListener('click', () => {
        selectContactModal.style.display = 'none';
    });

    beautifyBtn.addEventListener('click', (e) => {
        e.preventDefault();
        homePage.style.display = 'none';
        beautifyPage.style.display = 'flex';
    });

    chatAppBtn.addEventListener('click', (e) => {
        e.preventDefault();
        homePage.style.display = 'none';
        chatAppPage.style.display = 'flex';
        // 姣忔杩涘叆榛樿鏄剧ず鑱婂ぉ椤甸潰
        switchChatTab('messages', '鑱婂ぉ');
    });

    if (appItem3) {
        appItem3.addEventListener('click', () => {
            alert('鎯呬荆绌洪棿鍔熻兘寮€鍙戜腑...');
        });
    }

    if (appItem4) {
        appItem4.addEventListener('click', () => {
            alert('浣滃鍗忎細鍔熻兘寮€鍙戜腑...');
        });
    }

    // 鍏抽棴鑱婂ぉ杞欢
    closeChatBtn.addEventListener('click', () => {
        homePage.style.display = 'flex';
        chatAppPage.style.display = 'none';
    });

    // 鑱婂ぉ搴曢儴瀵艰埅鍒囨崲
    chatNavItems.forEach(item => {
        item.addEventListener('click', () => {
            const target = item.dataset.target;
            const title = item.querySelector('span').innerText;
            switchChatTab(target, title);
        });
    });

    function switchChatTab(targetId, title) {
        // 鏇存柊瀵艰埅楂樹寒
        chatNavItems.forEach(nav => {
            if (nav.dataset.target === targetId) {
                nav.classList.add('active');
                // 鍒囨崲鍥炬爣鏍峰紡 (瀹炲績/绌哄績)
                const i = nav.querySelector('i');
                if(targetId === 'messages') i.className = 'bx bxs-message-rounded';
                if(targetId === 'contacts') i.className = 'bx bxs-contact';
                if(targetId === 'moments') i.className = 'bx bx-world'; // 鍋囪涓栫晫鍥炬爣浠ｈ〃鏈嬪弸鍦?
                if(targetId === 'mine') i.className = 'bx bxs-user';
            } else {
                nav.classList.remove('active');
                const i = nav.querySelector('i');
                if(nav.dataset.target === 'messages') i.className = 'bx bx-message-rounded';
                if(nav.dataset.target === 'contacts') i.className = 'bx bxs-contact';
                if(nav.dataset.target === 'moments') i.className = 'bx bx-world';
                if(nav.dataset.target === 'mine') i.className = 'bx bx-user';
            }
        });

        // 鏇存柊闈㈡澘鏄剧ず
        chatViewPanels.forEach(panel => {
            if (panel.id === `chat-view-${targetId}`) {
                panel.classList.add('active');
            } else {
                panel.classList.remove('active');
            }
        });

        // 鏇存柊鏍囬
        chatHeaderTitle.innerText = title;
        
        // 鏇存柊鍙充笂瑙掓寜閽樉绀?
        addFriendBtn.style.display = targetId === 'messages' ? 'block' : 'none';
        addContactBtn.style.display = targetId === 'contacts' ? 'block' : 'none';
        
        // Special logic for Moments tab
        const headerActions = document.querySelector('.chat-header-right');
        if (targetId === 'moments') {
            viewingProfileId = 'user';
            updateMomentsProfileHeader();
            renderMomentsFeed();
            // Provide + and AI buttons in header for moments
            headerActions.innerHTML = `
                <button class="header-action-btn" id="bind-ai-btn-tab" style="font-size: 22px;"><i class='bx bx-bot'></i></button>
                <button class="header-action-btn" id="post-moment-btn-tab" style="font-size: 22px;"><i class='bx bx-plus-square'></i></button>
            `;
            // Attach event listeners for the newly injected buttons
            document.getElementById('bind-ai-btn-tab').addEventListener('click', () => {
                const aiSettingsModal = document.getElementById('moment-ai-settings-modal');
                if (aiSettingsModal) {
                    const aiCompanionSelect = document.getElementById('moment-ai-companion-select');
                    const aiFreqInput = document.getElementById('moment-ai-freq-input');
                    let aiSettings = JSON.parse(localStorage.getItem('moment_ai_settings') || '{"companionId":"","frequency":24,"lastPostTime":0}');
                    aiCompanionSelect.innerHTML = '<option value="">涓嶇粦瀹?/option>';
                    contacts.forEach(c => {
                        const opt = document.createElement('option');
                        opt.value = c.id;
                        opt.innerText = c.name;
                        aiCompanionSelect.appendChild(opt);
                    });
                    aiCompanionSelect.value = aiSettings.companionId || '';
                    aiFreqInput.value = aiSettings.frequency || 24;
                    aiSettingsModal.style.display = 'flex';
                }
            });
            document.getElementById('post-moment-btn-tab').addEventListener('click', () => {
                const postMomentModal = document.getElementById('post-moment-modal');
                if (postMomentModal) {
                    postContentInput.value = '';
                    postSelectedImages = [];
                    renderPostImages();
                    initPostAuthorSelect();
                    postMomentModal.style.display = 'flex';
                }
            });
        } else {
            // Restore default header actions
            headerActions.innerHTML = `
                <button class="header-action-btn" id="add-friend-btn" style="display: ${targetId === 'messages' ? 'block' : 'none'}"><i class='bx bx-user-plus'></i></button>
                <button class="header-action-btn" id="add-contact-btn" style="display: ${targetId === 'contacts' ? 'block' : 'none'}"><i class='bx bx-plus'></i></button>
            `;
            // Reattach listeners
            document.getElementById('add-friend-btn').addEventListener('click', () => {
                renderSelectContacts();
                selectContactModal.style.display = 'flex';
            });
            document.getElementById('add-contact-btn').addEventListener('click', () => {
                editingContactId = null;
                addContactPage.style.display = 'flex';
                document.querySelector('.add-contact-header h2').innerText = '娣诲姞浜鸿';
                document.getElementById('contact-input-name').value = '';
                document.getElementById('contact-input-gender').value = '';
                document.getElementById('contact-input-age').value = '';
                document.getElementById('contact-input-opening').value = '';
                document.getElementById('contact-input-desc').value = '';
                contactAvatarPreview.style.backgroundImage = 'none';
                contactAvatarPreview.classList.remove('has-photo');
                currentContactAvatarBase64 = '';
                const deleteContactBtn = document.getElementById('delete-contact-btn');
                if (deleteContactBtn) deleteContactBtn.style.display = 'none';
            });
        }
        
        if (targetId === 'contacts') renderContacts();
        if (targetId === 'messages') renderChatList();
    }

    beautifyBtn.addEventListener('click', (e) => {
        e.preventDefault();
        homePage.style.display = 'none';
        beautifyPage.style.display = 'flex';
    });
    backBtn.addEventListener('click', () => {
        homePage.style.display = 'flex';
        beautifyPage.style.display = 'none';
    });
    // --- 缇庡寲涓績鏂扮増閫昏緫 ---
    // 1. 澹佺焊鐢诲粖
    const wallpaperGallery = document.getElementById('wallpaper-gallery');
    const uploadWallpaperInput = document.getElementById('upload-wallpaper');
    
    // 浠庢湰鍦板瓨鍌ㄥ姞杞戒笂浼犺繃鐨勫绾稿苟娣诲姞鍒扮敾寤?
    const customWallpapers = JSON.parse(localStorage.getItem('customWallpapers') || '[]');
    customWallpapers.forEach(url => {
        const div = document.createElement('div');
        div.className = 'wallpaper-card';
        div.dataset.wallpaper = url;
        div.style.backgroundImage = `url('${url}')`;
        if (wallpaperGallery) wallpaperGallery.insertBefore(div, wallpaperGallery.children[1]); // Insert after Upload button
    });

    window.applyWallpaper = (url) => {
        phoneScreen.style.backgroundImage = `url('${url}')`;
        localStorage.setItem('selectedWallpaper', url);
        document.querySelectorAll('.wallpaper-card').forEach(t => t.classList.remove('active'));
        const activeThumb = [...document.querySelectorAll('.wallpaper-card')].find(t => t.dataset.wallpaper === url);
        if (activeThumb) activeThumb.classList.add('active');
    };
    
    // 鍒濆鍖栧绾哥偣鍑讳簨浠?
    if (wallpaperGallery) {
        wallpaperGallery.addEventListener('click', (e) => {
            const item = e.target.closest('.wallpaper-card[data-wallpaper]');
            if (item) {
                applyWallpaper(item.dataset.wallpaper);
            }
        });
    }

    if (uploadWallpaperInput) {
        uploadWallpaperInput.addEventListener('change', (e) => {
            const file = e.target.files[0]; if (!file) return;
            compressImage(file, 800, 1400, 0.6, (dataUrl) => {
                if(dataUrl) {
                    customWallpapers.unshift(dataUrl);
                    localStorage.setItem('customWallpapers', JSON.stringify(customWallpapers));
                    
                    const div = document.createElement('div');
                    div.className = 'wallpaper-card';
                    div.dataset.wallpaper = dataUrl;
                    div.style.backgroundImage = `url('${dataUrl}')`;
                    
                    if (wallpaperGallery) {
                        wallpaperGallery.insertBefore(div, wallpaperGallery.children[1]);
                    }
                    
                    applyWallpaper(dataUrl);
                }
            });
        });
    }

    // 榛樿澹佺焊搴旂敤
    document.querySelectorAll('.wallpaper-card[data-wallpaper]').forEach(thumb => {
        thumb.style.backgroundImage = `url('${thumb.dataset.wallpaper}')`;
    });
    
    // 2. APP鍥炬爣鏇挎崲閫昏緫
    const appListSidebar = document.getElementById('app-list-sidebar');
    const customizableIcons = document.querySelectorAll('.icon-customizable');
    const appIconPreviewLarge = document.getElementById('app-icon-preview-large');
    const appNameEditInput = document.getElementById('app-name-edit-input');
    const saveAppIconBtn = document.getElementById('save-app-icon-btn');
    const uploadAppIcon = document.getElementById('upload-app-icon');
    
    let currentEditingAppId = null;
    let tempAppIconBase64 = null;

    function renderAppSidebar() {
        if (!appListSidebar) return;
        appListSidebar.innerHTML = '';
        customizableIcons.forEach((iconItem, index) => {
            if (!iconItem.id) return;
            const originalName = iconItem.querySelector('span')?.innerText || 'APP';
            const savedName = localStorage.getItem(`custom-name-${iconItem.id}`);
            const displayName = savedName || originalName;

            const div = document.createElement('div');
            div.className = 'app-nav-item';
            div.innerText = displayName;
            div.dataset.appid = iconItem.id;
            
            div.addEventListener('click', () => {
                document.querySelectorAll('.app-nav-item').forEach(el => el.classList.remove('active'));
                div.classList.add('active');
                loadAppEditor(iconItem.id, displayName);
            });
            
            appListSidebar.appendChild(div);
            
            if (index === 0) {
                div.click();
            }
        });
    }

    function loadAppEditor(appId, appName) {
        currentEditingAppId = appId;
        tempAppIconBase64 = null;
        appNameEditInput.value = appName;
        
        const savedIcon = localStorage.getItem(`custom-icon-${appId}`);
        if (savedIcon) {
            appIconPreviewLarge.style.backgroundImage = `url('${savedIcon}')`;
            appIconPreviewLarge.classList.add('has-image');
        } else {
            appIconPreviewLarge.style.backgroundImage = 'none';
            appIconPreviewLarge.classList.remove('has-image');
            // Try to find an icon class
            const el = document.getElementById(appId);
            const iconHTML = el ? el.querySelector('i')?.outerHTML : '';
            appIconPreviewLarge.innerHTML = iconHTML || "<i class='bx bx-image-add'></i>";
        }
    }

    if (uploadAppIcon) {
        uploadAppIcon.addEventListener('change', (e) => {
            const file = e.target.files[0]; if(!file) return;
            compressImage(file, 512, 512, 0.9, (dataUrl) => {
                if(dataUrl) {
                    tempAppIconBase64 = dataUrl;
                    appIconPreviewLarge.style.backgroundImage = `url('${dataUrl}')`;
                    appIconPreviewLarge.classList.add('has-image');
                }
            });
        });
    }

    if (saveAppIconBtn) {
        saveAppIconBtn.addEventListener('click', () => {
            if (!currentEditingAppId) return;
            const newName = appNameEditInput.value.trim();
            const targetEl = document.getElementById(currentEditingAppId);
            
            if (newName && targetEl) {
                localStorage.setItem(`custom-name-${currentEditingAppId}`, newName);
                const span = targetEl.querySelector('span');
                if (span) span.innerText = newName;
                
                // Update sidebar
                const sidebarItem = appListSidebar.querySelector(`.app-nav-item[data-appid="${currentEditingAppId}"]`);
                if (sidebarItem) sidebarItem.innerText = newName;
            }
            
            if (tempAppIconBase64 && targetEl) {
                localStorage.setItem(`custom-icon-${currentEditingAppId}`, tempAppIconBase64);
                targetEl.style.backgroundImage = `url('${tempAppIconBase64}')`;
                targetEl.classList.add('has-custom-icon');
            }
            
            alert('Saved successfully!');
        });
    }

    // Call render once to init
    renderAppSidebar();

    const fontFamilyInput = document.getElementById('font-family-input');
    const fontUrlInput = document.getElementById('font-url-input');
    const fontFileInput = document.getElementById('font-file-input');
    const fontStyleTag = document.getElementById('custom-font-style-tag');
    const saveFontBtn = document.getElementById('save-font-btn');
    const fontStatusMsg = document.getElementById('font-status-msg');

    let tempFontDataUrl = null;

    if (fontFileInput) {
        fontFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => { 
                tempFontDataUrl = event.target.result;
                fontStatusMsg.innerText = 'File selected. Click Save.';
            };
            reader.readAsDataURL(file);
        });
    }

    const applyAndSaveFont = ({ family, url, dataUrl }) => {
        if (!family) { alert('蹇呴』涓哄瓧浣撳懡鍚嶏紒'); return; }
        let src = '';
        if (dataUrl) {
            src = `url('${dataUrl}')`;
        } else if (url) {
            let parsedUrl = url;
            if (parsedUrl.includes('raw.githubusercontent.com')) {
                parsedUrl = parsedUrl.replace('raw.githubusercontent.com', 'cdn.jsdelivr.net/gh');
                parsedUrl = parsedUrl.replace('/main/', '@main/');
                parsedUrl = parsedUrl.replace('/master/', '@master/');
            }
            src = `url('${parsedUrl}')`;
        }
        if (!src) { return; }
        const fontFaceRule = `@font-face { font-family: '${family}'; src: ${src}; font-display: swap; }`;
        fontStyleTag.innerHTML = fontFaceRule;
        document.documentElement.style.setProperty('--font-main', `'${family}', sans-serif`);
        localStorage.setItem('customFontFamily', family);
        localStorage.setItem('customFontUrl', url || '');
        localStorage.setItem('customFontDataUrl', dataUrl || '');
        alert('Font saved successfully!');
        fontStatusMsg.innerText = `Font '${family}' applied successfully!`;
    };

    if (saveFontBtn) {
        saveFontBtn.addEventListener('click', () => {
            const family = fontFamilyInput.value.trim();
            const url = fontUrlInput.value.trim();
            
            if (!family) {
                alert('Please enter a Font Name!');
                return;
            }
            if (!url && !tempFontDataUrl) {
                alert('Please provide a URL or upload a file!');
                return;
            }
            
            applyAndSaveFont({ family, url, dataUrl: tempFontDataUrl });
        });
    }
    const hiddenInputsContainer = document.getElementById('hidden-file-inputs') || document.body;
    const createWidgetFileInput=(id,target)=>{const i=document.createElement('input');i.type='file';i.id=id;i.className='hidden-file-input';i.accept='image/*';i.dataset.target=target;hiddenInputsContainer.appendChild(i);return i;};
    const widgetInputs=[['upload-top-1','image-target-top-1'],['upload-top-2','image-target-top-2'],['upload-top-3','image-target-top-3'],['upload-avatar-1','image-target-avatar-1'],['upload-avatar-2','image-target-avatar-2'],['upload-main-photo','image-target-main-photo'],['upload-profile-bg','profile-widget-bg']];
    widgetInputs.forEach(([id,target])=>{const i=createWidgetFileInput(id,target);i.addEventListener('change',handleWidgetImageUpload)});
    function handleWidgetImageUpload(event){const i=event.target,f=i.files[0];if(!f)return;const r=new FileReader;r.onload=e=>{const t=e.target.result,a=i.dataset.target,n=document.getElementById(a);if(n){n.style.backgroundImage=`url(${t})`;if(n.classList.contains('photo-widget'))n.classList.add('has-image');localStorage.setItem(a,t)}};r.readAsDataURL(f)}
    const loadWidgetImages=()=>{widgetInputs.forEach(([id,target])=>{const s=localStorage.getItem(target);if(s){const e=document.getElementById(target);if(e){e.style.backgroundImage=`url(${s})`;if(e.classList.contains('photo-widget'))e.classList.add('has-image');if(target==='profile-widget-bg')e.style.backgroundSize='cover';}}})};
    const editableTexts=document.querySelectorAll('[contenteditable="true"]');
    editableTexts.forEach(el=>el.addEventListener('blur',()=>localStorage.setItem(el.id,el.innerText)));
    const loadTexts=()=>editableTexts.forEach(el=>{const s=localStorage.getItem(el.id);if(s)el.innerText=s;});
    const updateTime=()=>{const e=document.getElementById('time');if(e){const n=new Date,h=String(n.getHours()).padStart(2,'0'),m=String(n.getMinutes()).padStart(2,'0');e.textContent=`${h}:${m}`}};
    const initBatteryAPI=()=>{const i=document.getElementById('battery-icon'),l=document.getElementById('battery-level');if('getBattery' in navigator){navigator.getBattery().then(b=>{const u=()=>{l.textContent=`${Math.round(b.level*100)}%`;i.className=b.charging?'bx bxs-battery-charging':'bx bxs-battery'};u();b.addEventListener('levelchange',u);b.addEventListener('chargingchange',u)})}else{i.parentElement.style.display='none'}};
    const loadSettings=()=>{
        localStorage.removeItem('');
        loadWidgetImages();
        loadTexts();
        updateTime();
        initBatteryAPI();
        setInterval(updateTime,10000);
        const savedWallpaper=localStorage.getItem('selectedWallpaper');
        if(savedWallpaper)applyWallpaper(savedWallpaper);
        customizableIcons.forEach(item=>{
            const savedIcon=localStorage.getItem(`custom-icon-${item.id}`);
            if(savedIcon){ item.style.backgroundImage = `url('${savedIcon}')`; item.classList.add('has-custom-icon'); }
            const savedName=localStorage.getItem(`custom-name-${item.id}`);
            if(savedName) {
                const nameEl = document.getElementById(`name-${item.id}`);
                if (nameEl) nameEl.innerText = savedName;
            }
        });
        localStorage.setItem('font-alert-shown', 'true');
        const savedFontFamily=localStorage.getItem('customFontFamily');
        if(savedFontFamily){
            const savedFontUrl=localStorage.getItem('customFontUrl');
            const savedFontDataUrl=localStorage.getItem('customFontDataUrl');
            applyAndSaveFont({family:savedFontFamily,url:savedFontUrl,dataUrl:savedFontDataUrl});
            fontFamilyInput.value=savedFontFamily;
            if(savedFontUrl)fontUrlInput.value=savedFontUrl;
        }
        localStorage.removeItem('font-alert-shown');
        localStorage.removeItem('');
    };
    loadSettings();

    // 姗＄毊绛嬫晥鏋滅敱CSS overscroll-behavior-y 鎺у埗锛屾棤闇€鍦ㄦ鍏ㄥ眬闃绘婊氬姩

    // --- LINE Profile 涓婚〉閫昏緫 ---
    const lineProfileBg = document.getElementById('line-profile-bg');
    const uploadLineBg = document.getElementById('upload-line-bg');
    const lineMainAvatar = document.getElementById('line-main-avatar');
    const uploadLineAvatar = document.getElementById('upload-line-avatar');
    const lineMainFrame = document.getElementById('line-main-frame');
    const uploadLineFrame = document.getElementById('upload-line-frame');
    const clearLineFrameBtn = document.getElementById('clear-line-frame-btn');
    
    const lineNickname = document.getElementById('line-nickname');
    const lineStatus = document.getElementById('line-status');
    
    const btnEnterMoments = document.getElementById('btn-enter-moments');
    const btnDecorate = document.getElementById('btn-decorate');
    const frameSelectModal = document.getElementById('frame-select-modal');
    const closeFrameModalBtn = document.getElementById('close-frame-modal-btn');
    const framePreviewAvatar = document.getElementById('frame-preview-avatar');
    const framePreviewFrame = document.getElementById('frame-preview-frame');

    const momentsFeedPage = document.getElementById('moments-feed-page');
    const closeMfBtn = document.getElementById('close-mf-btn');
    const postMomentBtn = document.getElementById('post-moment-btn');
    const postMomentModal = document.getElementById('post-moment-modal');
    const cancelPostBtn = document.getElementById('cancel-post-btn');
    const submitMomentBtn = document.getElementById('submit-moment-btn');

    const lineSettingsBtn = document.getElementById('line-settings-btn');
    if (lineSettingsBtn) {
        lineSettingsBtn.addEventListener('click', () => {
            alert('馃挕 鎻愮ず锛歕n- 鐐瑰嚮椤堕儴浠绘剰绌虹櫧澶勫彲鏇存崲鑳屾櫙\n- 鐐瑰嚮涓棿澶村儚鍙洿鎹㈠ご鍍廫n- 鐐瑰嚮鏄电О鍜岀姸鎬佹枃瀛楀彲鐩存帴杩涜淇敼\n- 鐐瑰嚮"瑁呴グ"鍙洿鎹㈠ご鍍忔');
        });
    }
    
    // 璁╄儗鏅偣鍑讳篃鑳借Е鍙戜笂浼狅紝鍥犱负鍘熷厛鐨勬寜閽闅愯棌/绉婚櫎浜?
    if (lineProfileBg) lineProfileBg.addEventListener('click', () => {
        uploadLineBg.click();
    });

    // 鍔犺浇 LINE Profile 鏁版嵁
    function loadLineProfile() {
        const data = JSON.parse(localStorage.getItem('line_profile_data') || '{}');
        if (data.bg) lineProfileBg.style.backgroundImage = `url('${data.bg}')`;
        if (data.avatar) {
            lineMainAvatar.style.backgroundImage = `url('${data.avatar}')`;
            framePreviewAvatar.style.backgroundImage = `url('${data.avatar}')`;
        }
        if (data.frame) {
            lineMainFrame.style.backgroundImage = `url('${data.frame}')`;
            framePreviewFrame.style.backgroundImage = `url('${data.frame}')`;
        } else {
            lineMainFrame.style.backgroundImage = 'none';
            framePreviewFrame.style.backgroundImage = 'none';
        }
        
        // 榛樿鏄剧ずUser
        if (data.nickname) {
            lineNickname.innerText = data.nickname;
        } else {
            lineNickname.innerText = 'User';
        }
        
        if (data.status) {
            lineStatus.innerText = data.status;
        }
    }

    function saveLineProfile(key, value) {
        const data = JSON.parse(localStorage.getItem('line_profile_data') || '{}');
        data[key] = value;
        safeSetItem('line_profile_data', JSON.stringify(data));
    }

    if (uploadLineBg) uploadLineBg.addEventListener('change', (e) => {
        const file = e.target.files[0]; if(!file) return;
        compressImage(file, 1080, 1920, 0.7, (dataUrl) => {
            if(dataUrl) {
                lineProfileBg.style.backgroundImage = `url('${dataUrl}')`;
                saveLineProfile('bg', dataUrl);
            }
        });
    });

    if (uploadLineAvatar) uploadLineAvatar.addEventListener('change', (e) => {
        const file = e.target.files[0]; if(!file) return;
        compressImage(file, 400, 400, 0.8, (dataUrl) => {
            if(dataUrl) {
                lineMainAvatar.style.backgroundImage = `url('${dataUrl}')`;
                framePreviewAvatar.style.backgroundImage = `url('${dataUrl}')`;
                saveLineProfile('avatar', dataUrl);
            }
        });
    });

    if (uploadLineFrame) uploadLineFrame.addEventListener('change', (e) => {
        const file = e.target.files[0]; if(!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target.result;
            lineMainFrame.style.backgroundImage = `url('${dataUrl}')`;
            framePreviewFrame.style.backgroundImage = `url('${dataUrl}')`;
            saveLineProfile('frame', dataUrl);
        };
        reader.readAsDataURL(file); // 澶村儚妗嗗彲鑳芥槸PNG閫忔槑鍥撅紝鐩存帴璇讳负DataURL
    });

    if (clearLineFrameBtn) clearLineFrameBtn.addEventListener('click', () => {
        lineMainFrame.style.backgroundImage = 'none';
        framePreviewFrame.style.backgroundImage = 'none';
        saveLineProfile('frame', '');
    });

    if (lineNickname) lineNickname.addEventListener('blur', () => saveLineProfile('nickname', lineNickname.innerText));
    if (lineStatus) lineStatus.addEventListener('blur', () => saveLineProfile('status', lineStatus.innerText));

    // 瑁呴グ鎸夐挳寮圭獥
    if (btnDecorate) btnDecorate.addEventListener('click', (e) => {
        e.preventDefault(); // 闃绘榛樿 label 琛屼负
        frameSelectModal.style.display = 'flex';
    });
    if (closeFrameModalBtn) closeFrameModalBtn.addEventListener('click', () => {
        frameSelectModal.style.display = 'none';
    });
    document.querySelectorAll('.ui-modal-bg').forEach(bg => bg.addEventListener('click', () => {
        frameSelectModal.style.display = 'none';
    }));

    // 杩涘叆鐪熸鐨勬湅鍙嬪湀娴?
    let viewingProfileId = 'user'; // 褰撳墠鏌ョ湅鐨勪富椤礗D锛?user' 鎴?瑙掕壊ID
    let generatedNpcs = []; // 瀛樻斁浠庝笘鐣屼功鐢熸垚鐨凬PC锛屾牸寮? {id, name, avatar}

    if (btnEnterMoments) btnEnterMoments.addEventListener('click', () => {
        openMomentsProfile('user');
    });

    window.openMomentsProfile = function(targetId) {
        viewingProfileId = targetId;
        
        // 濡傛灉鏄墦寮€鐢ㄦ埛鑷繁鐨勪富椤碉紝鍚屾椂閲嶆柊鐢熸垚涓€閬峃PC
        if (targetId === 'user') {
            generateNpcsFromWorldbook();
            // Show the moments tab instead of the full screen modal
            switchChatTab('moments', '鏈嬪弸鍦?);
        } else {
            // Full screen modal for others
            momentsFeedPage.style.display = 'flex';
            updateMomentsProfileHeader(true);
            renderMomentsFeed(true);
        }
    };

    function updateMomentsProfileHeader(isOthers = false) {
        const prefix = isOthers ? '-others' : '';
        const igName = document.getElementById('ig-current-name' + prefix);
        const igDesc = document.getElementById('ig-current-desc' + prefix);
        const igAvatar = document.getElementById('ig-current-avatar' + prefix);
        const igPosts = document.getElementById('ig-stat-posts' + prefix);
        const igFollowers = document.getElementById('ig-stat-followers' + prefix);
        const igFollowing = document.getElementById('ig-stat-following' + prefix);
        const igEditBtn = document.getElementById('ig-edit-profile-btn' + prefix);

        let profileName = '';
        let profileDesc = '';
        let profileAvatar = '';

        if (viewingProfileId === 'user') {
            const lineData = JSON.parse(localStorage.getItem('line_profile_data') || '{}');
            const igData = JSON.parse(localStorage.getItem('ig_profile_data') || '{}');
            profileName = igData.username || '@username';
            profileDesc = igData.bio || 'Default Signature';
            profileAvatar = igData.avatar || lineData.avatar || '';
            igEditBtn.style.display = 'block';
        } else if (viewingProfileId.startsWith('npc_')) {
            const npc = generatedNpcs.find(n => n.id === viewingProfileId);
            if (npc) {
                profileName = '@' + npc.name;
                profileDesc = npc.desc || 'Worldbook NPC';
                profileAvatar = npc.avatar;
            }
            igEditBtn.style.display = 'none';
        } else {
            // 鏄鑹?
            const c = contacts.find(x => x.id === viewingProfileId);
            if (c) {
                profileName = '@' + c.name;
                profileDesc = c.desc || 'Default Signature';
                profileAvatar = c.avatar || '';
            }
            igEditBtn.style.display = 'none';
        }

        if(igName) igName.innerText = profileName;
        if(igDesc) igDesc.innerText = profileDesc;
        if(igAvatar) igAvatar.style.backgroundImage = profileAvatar ? `url('${profileAvatar}')` : 'none';

        // 缁熻璇ョ敤鎴风殑甯栧瓙鏁?
        const postCount = momentsData.filter(m => m.authorId === viewingProfileId).length;
        if(igPosts) igPosts.innerText = postCount;

        if(!isOthers) renderStoriesRow();
    }

    function generateNpcsFromWorldbook() {
        generatedNpcs = [];
        const allWbs = worldBooks.global.concat(worldBooks.local);
        const npcWbs = allWbs.filter(wb => wb.type === 'item');
        
        // 绠€鍗曟ā鎷? 閬嶅巻鎵€鏈?worldbook item锛岀敓鎴怤PC
        npcWbs.forEach((wb, idx) => {
            // 鍙栨爣棰樹綔涓篘PC鍚嶅瓧
            const npcName = wb.title.substring(0, 10);
            generatedNpcs.push({
                id: 'npc_' + wb.id,
                name: npcName,
                desc: wb.content.substring(0, 50) + '...',
                // 浣跨敤涓€涓崰浣嶅ご鍍忥紝鎴栬€呬娇鐢ㄨ儗鏅壊
                avatar: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23${Math.floor(Math.random()*16777215).toString(16)}" width="100" height="100"/><text x="50" y="50" font-family="Arial" font-size="40" fill="white" text-anchor="middle" dy=".3em">${npcName.charAt(0)}</text></svg>`
            });
        });
    }

    function renderStoriesRow() {
        const container = document.getElementById('ig-stories-container');
        container.innerHTML = '';

        // 濡傛灉鏄疷ser涓婚〉锛岀涓€涓缁堟槸娣诲姞Story鎸夐挳 (铏界劧杩欓噷鍙槸UI灞曠ず)
        if (viewingProfileId === 'user') {
            const addStory = document.createElement('div');
            addStory.className = 'ig-story-item';
            addStory.innerHTML = `
                <div class="ig-story-avatar" style="border-color: #fff;"><i class='bx bx-plus' style="font-size:32px; color:#111;"></i></div>
                <span class="ig-story-name">New</span>
            `;
            container.appendChild(addStory);
        }

        // 鎶婂綋鍓嶆湁甯栧瓙鐨勮鑹?鍜?鐢熸垚鐨凬PC 鏀捐繘 Story Row
        const storyEntities = [...contacts, ...generatedNpcs];
        
        storyEntities.forEach(entity => {
            if (entity.id === viewingProfileId) return; // 涓嶅湪鑷繁鐨凷tory閲屾樉绀鸿嚜宸?

            const div = document.createElement('div');
            div.className = 'ig-story-item has-story';
            div.innerHTML = `
                <div class="ig-story-avatar" style="background-image: url('${entity.avatar || ''}');"></div>
                <span class="ig-story-name">${entity.name}</span>
            `;
            div.addEventListener('click', () => {
                openMomentsProfile(entity.id);
            });
            container.appendChild(div);
        });
    }
    if (closeMfBtn) closeMfBtn.addEventListener('click', () => {
        momentsFeedPage.style.display = 'none';
    });

    // 杩斿洖閿槻璇Е鎷︽埅 (鑱婂ぉ椤?
    const convTopBar = document.getElementById('conv-top-bar');
    if (convTopBar) {
        convTopBar.addEventListener('click', (e) => {
            if (e.target.tagName !== 'I' && e.target.tagName !== 'BUTTON' && !e.target.classList.contains('conv-back-btn')) {
                // 鐐瑰嚮鑳屾櫙鍏朵粬鍦版柟
                const weiboBgUpload = document.getElementById('upload-conv-bg');
                if (weiboBgUpload) weiboBgUpload.click();
            }
        });
    }

    // --- Edit Profile 閫昏緫 ---
    const igEditProfileBtn = document.getElementById('ig-edit-profile-btn');
    const igEditProfileModal = document.getElementById('ig-edit-profile-modal');
    const closeIgEditBtn = document.getElementById('close-ig-edit-btn');
    const closeIgEditBg = document.getElementById('close-ig-edit-bg');
    const saveIgProfileBtn = document.getElementById('save-ig-profile-btn');
    const igEditAvatarPreview = document.getElementById('ig-edit-avatar-preview');
    const uploadIgAvatar = document.getElementById('upload-ig-avatar');
    const igEditUsername = document.getElementById('ig-edit-username');
    const igEditBio = document.getElementById('ig-edit-bio');

    let tempIgAvatarBase64 = null;

    if (igEditProfileBtn) {
        if (igEditProfileBtn) igEditProfileBtn.addEventListener('click', () => {
            const igData = JSON.parse(localStorage.getItem('ig_profile_data') || '{}');
            const lineData = JSON.parse(localStorage.getItem('line_profile_data') || '{}');
            igEditUsername.value = igData.username || '@username';
            igEditBio.value = igData.bio || 'Default Signature';
            tempIgAvatarBase64 = igData.avatar || lineData.avatar || '';
            igEditAvatarPreview.style.backgroundImage = tempIgAvatarBase64 ? `url('${tempIgAvatarBase64}')` : 'none';
            igEditAvatarPreview.innerHTML = tempIgAvatarBase64 ? '' : "<i class='bx bx-camera' style='font-size: 24px; color: #888;'></i>";
            igEditProfileModal.style.display = 'flex';
        });
    }

    if (closeIgEditBtn) closeIgEditBtn.addEventListener('click', () => igEditProfileModal.style.display = 'none');
    if (closeIgEditBg) closeIgEditBg.addEventListener('click', () => igEditProfileModal.style.display = 'none');

    if (uploadIgAvatar) {
        if (uploadIgAvatar) uploadIgAvatar.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            compressImage(file, 400, 400, 0.8, (dataUrl) => {
                if (dataUrl) {
                    tempIgAvatarBase64 = dataUrl;
                    igEditAvatarPreview.style.backgroundImage = `url('${tempIgAvatarBase64}')`;
                    igEditAvatarPreview.innerHTML = '';
                }
            });
        });
    }

    if (saveIgProfileBtn) {
        if (saveIgProfileBtn) saveIgProfileBtn.addEventListener('click', () => {
            const igData = {
                username: igEditUsername.value.trim(),
                bio: igEditBio.value.trim(),
                avatar: tempIgAvatarBase64
            };
            localStorage.setItem('ig_profile_data', JSON.stringify(igData));
            updateMomentsProfileHeader();
            igEditProfileModal.style.display = 'none';
        });
    }

    // --- 鏈嬪弸鍦堝彂甯冮€昏緫 ---
    let momentsData = JSON.parse(localStorage.getItem('moments_data') || '[]'); // [{id, authorId, text, images:[], time, comments:[]}]
    let postSelectedImages = [];

    const uploadMomentImage = document.getElementById('upload-moment-image');
    const postImageGrid = document.getElementById('post-image-grid');
    const postAuthorSelect = document.getElementById('post-author-select');
    const postContentInput = document.getElementById('post-content-input');
    const postAuthorAvatar = document.getElementById('post-author-avatar');
    
    // AI 缁戝畾鍔熻兘
    const bindAiBtn = document.getElementById('bind-ai-btn');
    const aiSettingsModal = document.getElementById('moment-ai-settings-modal');
    const closeAiSettingsBtn = document.getElementById('close-ai-settings-btn');
    const aiCompanionSelect = document.getElementById('moment-ai-companion-select');
    const aiFreqInput = document.getElementById('moment-ai-freq-input');
    const saveAiSettingsBtn = document.getElementById('save-ai-settings-btn');
    const forceAiPostBtn = document.getElementById('force-ai-post-btn');
    
    let aiSettings = JSON.parse(localStorage.getItem('moment_ai_settings') || '{"companionId":"","frequency":24,"lastPostTime":0}');

    if (bindAiBtn) {
        if (bindAiBtn) bindAiBtn.addEventListener('click', () => {
            aiCompanionSelect.innerHTML = '<option value="">涓嶇粦瀹?/option>';
            contacts.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id;
                opt.innerText = c.name;
                aiCompanionSelect.appendChild(opt);
            });
            aiCompanionSelect.value = aiSettings.companionId || '';
            aiFreqInput.value = aiSettings.frequency || 24;
            aiSettingsModal.style.display = 'flex';
        });
    }

    if (closeAiSettingsBtn) closeAiSettingsBtn.addEventListener('click', () => aiSettingsModal.style.display = 'none');

    if (saveAiSettingsBtn) {
        if (saveAiSettingsBtn) saveAiSettingsBtn.addEventListener('click', () => {
            aiSettings.companionId = aiCompanionSelect.value;
            aiSettings.frequency = parseInt(aiFreqInput.value) || 24;
            localStorage.setItem('moment_ai_settings', JSON.stringify(aiSettings));
            alert('AI浜掑姩璁剧疆宸蹭繚瀛橈紒');
            aiSettingsModal.style.display = 'none';
        });
    }

    if (forceAiPostBtn) {
        if (forceAiPostBtn) forceAiPostBtn.addEventListener('click', async () => {
            if (!aiSettings.companionId) {
                alert('璇峰厛閫夋嫨涓€涓粦瀹氳鑹诧紒');
                return;
            }
            
            const originalHtml = forceAiPostBtn.innerHTML;
            forceAiPostBtn.innerHTML = '姝ｅ湪璁〢I鎬濊€?..';
            forceAiPostBtn.disabled = true;

            const cId = aiSettings.companionId;
            const cInfo = contacts.find(x => x.id === cId);
            if (!cInfo) return;

            const apiData = JSON.parse(localStorage.getItem('api_settings') || '{}');
            if (!apiData.url || !apiData.key || !apiData.modelName) {
                alert('璇峰厛鍦ㄨ缃腑閰嶇疆API浠ヤ娇鐢ㄧ敓鎴愬姛鑳姐€?);
                forceAiPostBtn.innerHTML = originalHtml;
                forceAiPostBtn.disabled = false;
                return;
            }

            let recentChat = "";
            let chatData = JSON.parse(localStorage.getItem('chat_messages') || '{}')[cId] || [];
            if (chatData.length > 0) {
                let lastMsgs = chatData.slice(-10).map(m => {
                    let sender = m.sender === 'me' ? 'User' : cInfo.name;
                    return `${sender}: ${m.text.replace(/\\[.*?\\]/g, '').trim()}`;
                }).filter(t => t.length > (t.indexOf(':') + 2)).join('\n');
                
                if (lastMsgs) {
                    recentChat = `\n浠ヤ笅鏄綘浠渶杩戠殑鑱婂ぉ璁板綍锛歕n${lastMsgs}\n璇峰姟蹇呰创鍚堟渶杩戠殑鑱婂ぉ鍐呭鍜屽綋涓嬬殑鎯呭鏉ュ彂鏈嬪弸鍦堬紝鎺ㄨ繘鎯呮劅锛岀粷瀵逛笉瑕佽劚绂昏亰澶╄褰曠┖鎯虫崗閫犮€俙;
                }
            }

            const sysPrompt = `浣犳壆婕旇鑹诧細${cInfo.name}銆備汉璁撅細${cInfo.desc || '鏃?}銆傝鍙戜竴鏉＄畝鐭殑鏈嬪弸鍦堝姩鎬併€備笉瑕佷换浣曡鏄庯紝鍙緭鍑烘湅鍙嬪湀姝ｆ枃锛屽彲浠ュ甫琛ㄦ儏绗﹀彿銆傚鏋滀綘鎯抽厤鍥撅紝璇峰湪鏈€鍚庡姞涓?[鍙戦€佸浘鐗?鍏蜂綋鐨勮嫳鏂囩敾闈㈡弿杩癩銆?{recentChat}`;

            try {
                let url = apiData.url;
                if (url.endsWith('/')) url = url.slice(0, -1);
                if (!url.endsWith('/chat/completions')) url += '/chat/completions';

                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiData.key}` },
                    body: JSON.stringify({
                        model: apiData.modelName,
                        messages: [{ role: 'system', content: sysPrompt }]
                    })
                });
                
                if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
                const result = await response.json();
                let text = result.choices[0].message.content;
                
                let imgHtml = [];
                let sendImgMatch = text.match(/\[鍙戦€佸浘鐗?(.*?)\]/);
                if (sendImgMatch) {
                    text = text.replace(sendImgMatch[0], '');
                    // 杩欓噷绠€鍖栧鐞嗭紝鐩存帴鐢ㄦ弿杩扮敓鎴愪竴鏉＄函鏂囨湰锛屾垨鑰呰皟鐢?nai 鐢熷浘
                    // 涓轰簡绋冲畾鍏堝彂涓€寮犲崰浣嶅浘鎴栬€呯敤 nai 鐢熷浘
                    if (window.handleAIGenerateImage) {
                        // Await image generation (using callback style)
                        await new Promise(resolve => {
                            window.handleAIGenerateImage(sendImgMatch[1], (res) => {
                                // Extract base64 src from result
                                const match = res.match(/src="(.*?)"/);
                                if (match) imgHtml.push(match[1]);
                                resolve();
                            });
                        });
                    }
                }

                momentsData.unshift({
                    id: 'm_' + Date.now(),
                    authorId: cId,
                    text: text.trim(),
                    images: imgHtml,
                    time: Date.now(),
                    comments: []
                });
                
                localStorage.setItem('moments_data', JSON.stringify(momentsData));
                renderMomentsFeed();
                aiSettingsModal.style.display = 'none';
                
            } catch (error) {
                console.error(error);
                alert('鐢熸垚澶辫触: ' + error.message);
            } finally {
                forceAiPostBtn.innerHTML = originalHtml;
                forceAiPostBtn.disabled = false;
            }
        });
    }

    // AI 鑷姩璇勮鐢熸垚
    async function triggerAIAutoComment(momentId, textContent) {
        if (!aiSettings.companionId) return;
        const cId = aiSettings.companionId;
        const cInfo = contacts.find(x => x.id === cId);
        if (!cInfo) return;

        const apiData = JSON.parse(localStorage.getItem('api_settings') || '{}');
        if (!apiData.url || !apiData.key || !apiData.modelName) return;

        const sysPrompt = `浣犳壆婕旇鑹诧細${cInfo.name}銆備汉璁撅細${cInfo.desc || '鏃?}銆備綘鐨勫ソ鏈嬪弸User鍒氬垰鍙戜簡涓€鏉℃湅鍙嬪湀锛氣€?{textContent}鈥濄€傝浣犱綔涓篢A鐨勫ソ鏈嬪弸锛屽洖澶嶄竴鏉＄畝鐭殑璇勮銆備笉瑕佸浣欑殑搴熻瘽锛屽彧杈撳嚭璇勮鍐呭銆俙;

        try {
            let url = apiData.url;
            if (url.endsWith('/')) url = url.slice(0, -1);
            if (!url.endsWith('/chat/completions')) url += '/chat/completions';

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiData.key}` },
                body: JSON.stringify({
                    model: apiData.modelName,
                    messages: [{ role: 'system', content: sysPrompt }]
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                let commentText = result.choices[0].message.content.trim();
                // Strip state tags if they exist
                commentText = commentText.replace(/\[鐘舵€?.*?\]/g, '').trim();
                
                const mIndex = momentsData.findIndex(x => x.id === momentId);
                if (mIndex !== -1) {
                    if (!momentsData[mIndex].comments) momentsData[mIndex].comments = [];
                    momentsData[mIndex].comments.push({
                        authorId: cId,
                        text: commentText
                    });
                    localStorage.setItem('moments_data', JSON.stringify(momentsData));
                    renderMomentsFeed();
                }
            }
        } catch (error) {
            console.error('Auto comment failed', error);
        }
    }
    
    function initPostAuthorSelect() {
        // 娓呯┖闄ser浠ュ鐨勯€夐」
        while(postAuthorSelect.options.length > 1) {
            postAuthorSelect.remove(1);
        }
        contacts.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.innerText = c.name;
            postAuthorSelect.appendChild(opt);
        });
        updatePostAuthorAvatar();
    }

    function updatePostAuthorAvatar() {
        const val = postAuthorSelect.value;
        if (val === 'user') {
            const lineData = JSON.parse(localStorage.getItem('line_profile_data') || '{}');
            postAuthorAvatar.style.backgroundImage = lineData.avatar ? `url('${lineData.avatar}')` : 'none';
        } else {
            const c = contacts.find(x => x.id === val);
            postAuthorAvatar.style.backgroundImage = c && c.avatar ? `url('${c.avatar}')` : 'none';
        }
    }

    if (postAuthorSelect) postAuthorSelect.addEventListener('change', updatePostAuthorAvatar);

    if (postMomentBtn) postMomentBtn.addEventListener('click', () => {
        postContentInput.value = '';
        postSelectedImages = [];
        renderPostImages();
        initPostAuthorSelect();
        postMomentModal.style.display = 'flex';
    });
    
    if (cancelPostBtn) cancelPostBtn.addEventListener('click', () => {
        postMomentModal.style.display = 'none';
    });

    if (uploadMomentImage) uploadMomentImage.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        
        let processed = 0;
        files.forEach(file => {
            if(postSelectedImages.length >= 9) return; // 鏈€澶?寮?
            compressImage(file, 800, 800, 0.7, (dataUrl) => {
                if(dataUrl) {
                    postSelectedImages.push(dataUrl);
                    processed++;
                    if(processed === Math.min(files.length, 9 - (postSelectedImages.length - processed))) {
                        renderPostImages();
                    }
                }
            });
        });
        e.target.value = '';
    });

    function renderPostImages() {
        // 娓呴櫎鐜版湁鐨勯瑙堝浘
        const previews = postImageGrid.querySelectorAll('.post-img-preview');
        previews.forEach(p => p.remove());
        
        const addBtn = postImageGrid.querySelector('.post-image-add-btn');
        
        postSelectedImages.forEach((url, idx) => {
            const div = document.createElement('div');
            div.className = 'post-img-preview';
            div.style.backgroundImage = `url('${url}')`;
            
            const rm = document.createElement('div');
            rm.className = 'remove-btn';
            rm.innerHTML = '<i class="bx bx-x"></i>';
            rm.onclick = (e) => {
                e.preventDefault();
                postSelectedImages.splice(idx, 1);
                renderPostImages();
            };
            div.appendChild(rm);
            postImageGrid.insertBefore(div, addBtn);
        });
        
        addBtn.style.display = postSelectedImages.length >= 9 ? 'none' : 'flex';
    }

    if (submitMomentBtn) submitMomentBtn.addEventListener('click', () => {
        const text = postContentInput.value.trim();
        if (!text && postSelectedImages.length === 0) {
            alert('璇寸偣浠€涔堟垨鑰呭彂寮犲浘鐗囧惂');
            return;
        }
        
        const authorId = postAuthorSelect.value;
        const momentId = 'm_' + Date.now();
        const newMoment = {
            id: momentId,
            authorId: authorId,
            text: text,
            images: [...postSelectedImages],
            time: Date.now(),
            comments: []
        };
        
        momentsData.unshift(newMoment);
        safeSetItem('moments_data', JSON.stringify(momentsData));
        
        postMomentModal.style.display = 'none';
        momentsFeedPage.style.display = 'flex'; // 鑷姩杩涘叆鏈嬪弸鍦堟祦
        renderMomentsFeed();
        
        // 瑙﹀彂鑷姩璇勮
        if (authorId === 'user' && text) {
            setTimeout(() => {
                triggerAIAutoComment(momentId, text);
            }, 3000);
        }
    });

    function formatTime(timestamp) {
        const d = new Date(timestamp);
        return `${d.getMonth()+1}-${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    }

    function renderMomentsFeed(isOthers = false) {
        const prefix = isOthers ? '-others' : '';
        const container = document.getElementById('mf-feed-container' + prefix);
        const emptyState = document.getElementById('mf-empty-state' + prefix);
        
        // 绉婚櫎鏃у笘瀛?
        const cards = container.querySelectorAll('.moment-card');
        cards.forEach(c => c.remove());
        
        // 鏍规嵁褰撳墠 viewingProfileId 杩囨护甯栧瓙
        const filteredMoments = momentsData.filter(m => m.authorId === viewingProfileId);
        
        if (filteredMoments.length === 0) {
            emptyState.style.display = 'flex';
        } else {
            emptyState.style.display = 'none';
            filteredMoments.forEach((m) => {
                let authorName = 'User';
                let authorAvatar = '';
                
                if (m.authorId === 'user') {
                    const igData = JSON.parse(localStorage.getItem('ig_profile_data') || '{}');
                    authorName = igData.username || '@username';
                    authorAvatar = igData.avatar || '';
                } else if (m.authorId.startsWith('npc_')) {
                    const npc = generatedNpcs.find(x => x.id === m.authorId);
                    if (npc) {
                        authorName = npc.name;
                        authorAvatar = npc.avatar;
                    }
                } else {
                    const c = contacts.find(x => x.id === m.authorId);
                    if (c) {
                        authorName = c.name;
                        authorAvatar = c.avatar || '';
                    } else {
                        authorName = '鏈煡瑙掕壊';
                    }
                }
                
                const card = document.createElement('div');
                card.className = 'moment-card';
                
                let imgHtml = '';
                if (m.images && m.images.length > 0) {
                    imgHtml = `<div class="moment-images" data-count="${Math.min(m.images.length, 4)}">
                        ${m.images.map(img => `<div class="moment-img-item" style="background-image: url('${img}')"></div>`).join('')}
                    </div>`;
                }

                let likesHtml = '';
                if (m.likes && m.likes.length > 0) {
                    likesHtml = `<div class="moment-likes-area">${m.likes.length} likes</div>`;
                }

                let commentsHtml = '';
                if (m.comments && m.comments.length > 0) {
                    const cList = m.comments.map((c, cIdx) => {
                        let cName = 'User';
                        if (c.authorId === 'user') {
                            const igData = JSON.parse(localStorage.getItem('ig_profile_data') || '{}');
                            cName = igData.username || 'User';
                        } else if (c.authorId.startsWith('npc_')) {
                            const npc = generatedNpcs.find(x => x.id === c.authorId);
                            if (npc) cName = npc.name;
                        } else {
                            const cc = contacts.find(x => x.id === c.authorId);
                            if (cc) cName = cc.name;
                        }
                        
                        let replyHtml = '';
                        if (c.replyTo && c.replyTo !== m.authorId) {
                            let rName = 'User';
                            if (c.replyTo !== 'user') {
                                const rc = contacts.find(x => x.id === c.replyTo);
                                if (rc) rName = rc.name;
                            }
                            replyHtml = ` @${rName}`;
                        }
                        return `<div class="moment-comment-item" onclick="replyToComment('${m.id}', ${cIdx}, '${c.authorId}', '${cName}')"><span class="moment-comment-name">${cName}</span>${replyHtml} ${c.text}</div>`;
                    }).join('');
                    commentsHtml = `<div class="moment-comments-area">${cList}</div>`;
                }
                
                let isLiked = m.likes && m.likes.includes('user');

                card.innerHTML = `
                    <div class="moment-header">
                        <div class="moment-avatar" style="background-image: url('${authorAvatar}')"></div>
                        <span class="moment-name">${authorName}</span>
                        ${m.authorId === 'user' ? `<button class="moment-del-btn" onclick="deleteMoment('${m.id}', event)"><i class='bx bx-dots-horizontal-rounded'></i></button>` : ''}
                    </div>
                    ${imgHtml}
                    <div class="moment-actions">
                        <button class="moment-action-btn ${isLiked ? 'liked' : ''}" onclick="toggleLike('${m.id}')"><i class='bx ${isLiked ? 'bxs-heart' : 'bx-heart'}'></i></button>
                        <button class="moment-action-btn" onclick="addComment('${m.id}')"><i class='bx bx-message-rounded'></i></button>
                        <button class="moment-action-btn"><i class='bx bx-send'></i></button>
                        <button class="moment-action-btn" style="margin-left: auto;"><i class='bx bx-bookmark'></i></button>
                    </div>
                    <div class="moment-interactions">
                        ${likesHtml}
                        ${m.text ? `<div class="moment-text"><span class="moment-comment-name">${authorName}</span> ${m.text.replace(/\n/g, '<br>')}</div>` : ''}
                        ${commentsHtml}
                        <div class="moment-time" style="padding: 0 15px; margin-top: 4px;">${formatTime(m.time)}</div>
                    </div>
                `;
                container.appendChild(card);
            });
        }
    }
    
    window.toggleLike = function(momentId) {
        const m = momentsData.find(x => x.id === momentId);
        if (m) {
            if (!m.likes) m.likes = [];
            const idx = m.likes.indexOf('user');
            if (idx === -1) m.likes.push('user');
            else m.likes.splice(idx, 1);
            safeSetItem('moments_data', JSON.stringify(momentsData));
            renderMomentsFeed();
        }
    };
    
    window.addComment = function(momentId) {
        const text = prompt('璇疯緭鍏ヨ瘎璁哄唴瀹?');
        if (text && text.trim()) {
            const m = momentsData.find(x => x.id === momentId);
            if (m) {
                if (!m.comments) m.comments = [];
                m.comments.push({ authorId: 'user', text: text.trim() });
                safeSetItem('moments_data', JSON.stringify(momentsData));
                renderMomentsFeed();
                
                if (m.authorId !== 'user') {
                    setTimeout(() => triggerAICommentReply(m.id, m.authorId, text.trim()), 2000);
                }
            }
        }
    };
    
    window.replyToComment = function(momentId, commentIdx, targetAuthorId, targetAuthorName) {
        if (targetAuthorId === 'user') return;
        const text = prompt(`鍥炲 ${targetAuthorName}:`);
        if (text && text.trim()) {
            const m = momentsData.find(x => x.id === momentId);
            if (m) {
                if (!m.comments) m.comments = [];
                m.comments.push({ authorId: 'user', text: text.trim(), replyTo: targetAuthorId });
                safeSetItem('moments_data', JSON.stringify(momentsData));
                renderMomentsFeed();
                
                setTimeout(() => triggerAICommentReply(m.id, targetAuthorId, text.trim()), 2000);
            }
        }
    };

    async function triggerAICommentReply(momentId, roleId, userText) {
        const cInfo = contacts.find(x => x.id === roleId);
        if (!cInfo) return;

        const apiData = JSON.parse(localStorage.getItem('api_settings') || '{}');
        if (!apiData.url || !apiData.key || !apiData.modelName) return;

        const sysPrompt = `浣犳壆婕旇鑹诧細${cInfo.name}銆備汉璁撅細${cInfo.desc || '鏃?}銆傚湪鏈嬪弸鍦堥噷锛孶ser瀵逛綘璇达細鈥?{userText}鈥濄€傝浣犱綔涓?{cInfo.name}锛屽洖澶嶄竴鏉＄畝鐭殑璇勮銆傚彧杈撳嚭璇勮鍐呭锛屼笉瑕佸浣欒鏄庛€俙;

        try {
            let url = apiData.url;
            if (url.endsWith('/')) url = url.slice(0, -1);
            if (!url.endsWith('/chat/completions')) url += '/chat/completions';

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiData.key}` },
                body: JSON.stringify({
                    model: apiData.modelName,
                    messages: [{ role: 'system', content: sysPrompt }]
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                let commentText = result.choices[0].message.content.trim();
                // Strip state tags if they exist
                commentText = commentText.replace(/\[鐘舵€?.*?\]/g, '').trim();
                
                const mIndex = momentsData.findIndex(x => x.id === momentId);
                if (mIndex !== -1) {
                    if (!momentsData[mIndex].comments) momentsData[mIndex].comments = [];
                    momentsData[mIndex].comments.push({
                        authorId: roleId,
                        text: commentText,
                        replyTo: 'user'
                    });
                    safeSetItem('moments_data', JSON.stringify(momentsData));
                    renderMomentsFeed();
                }
            }
        } catch (error) {
            console.error('AI reply failed', error);
        }
    }

    window.deleteMoment = function(id, event) {
        event.stopPropagation();
        if(confirm('纭畾瑕佸垹闄よ繖鏉″姩鎬佸悧锛?)) {
            momentsData = momentsData.filter(m => m.id !== id);
            safeSetItem('moments_data', JSON.stringify(momentsData));
            updateMomentsProfileHeader(); // Update post count
            renderMomentsFeed();
        }
    };

    // 澶村儚鐐瑰嚮浜嬩欢锛氭墦寮€鑱婂ぉ瀵硅薄鐨勬湅鍙嬪湀
    if(convHeaderAvatar) {
        convHeaderAvatar.addEventListener('click', () => {
            if (currentActiveContactId) {
                openMomentsProfile(currentActiveContactId);
            }
        });
    }

    // 娑堟伅鍒楄〃涓殑澶村儚鐐瑰嚮浜嬩欢锛氫篃鑳芥墦寮€鍏舵湅鍙嬪湀
    convMessagesContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('msg-avatar')) {
            const row = e.target.closest('.msg-row');
            if (row) {
                if (row.classList.contains('sent')) {
                    openMomentsProfile('user');
                } else if (row.classList.contains('received')) {
                    if (currentActiveContactId) openMomentsProfile(currentActiveContactId);
                }
            }
        }
    });

    // 涓?NPC 鐢熸垚涓€浜涘亣甯栧瓙锛屾柟渚挎祴璇曟紨绀?
    function generateMockNpcPostsIfNeeded() {
        if (generatedNpcs.length > 0) {
            generatedNpcs.forEach(npc => {
                const hasPost = momentsData.find(m => m.authorId === npc.id);
                if (!hasPost) {
                    momentsData.push({
                        id: 'm_' + Date.now() + Math.random(),
                        authorId: npc.id,
                        text: `Hello world from ${npc.name}! 鉁╜,
                        images: [],
                        time: Date.now() - Math.floor(Math.random()*10000000),
                        comments: [],
                        likes: []
                    });
                }
            });
            safeSetItem('moments_data', JSON.stringify(momentsData));
        }
    }
    
    // 瀹氭椂鐢熸垚涓€浜汵PC甯栧瓙淇濊瘉涓栫晫涔﹁仈鍔?
    setInterval(generateMockNpcPostsIfNeeded, 5000);

    // 鍒濆鍖栧姞杞?
    try { loadLineProfile(); } catch(e) { console.warn("loadLineProfile skipped:", e); }

    // --- 鏄熸槦绯荤粺 (Star System) 閫昏緫 ---
    const starSystemAppBtn = document.getElementById('app-item-5');
    const starSystemPage = document.getElementById('star-system-page');
    const closeSsBtn = document.getElementById('close-ss-btn');
    
    const ssTotalStars = document.getElementById('ss-total-stars');
    const ssLevel = document.getElementById('ss-level');
    
    const ssBtnCheckin = document.getElementById('ss-btn-checkin');
    const ssBtnJourney = document.getElementById('ss-btn-journey');
    const ssBtnBottle = document.getElementById('ss-btn-bottle');
    const ssBtnGallery = document.getElementById('ss-btn-gallery');
    
    const ssJourneyModal = document.getElementById('ss-journey-modal');
    const closeJourneyBtn = document.getElementById('close-journey-btn');
    const journeyDestInput = document.getElementById('journey-dest-input');
    const journeyCompanionSelect = document.getElementById('journey-companion-select');
    const startJourneyBtn = document.getElementById('start-journey-btn');
    const journeyProgressArea = document.getElementById('journey-progress-area');
    
    const ssGalleryPage = document.getElementById('ss-gallery-page');
    const closeGalleryBtn = document.getElementById('close-gallery-btn');
    const gallerySystemBadges = document.getElementById('gallery-system-badges');
    const galleryCompanionMemories = document.getElementById('gallery-companion-memories');
    
    const ssBottlePage = document.getElementById('ss-bottle-page');
    const closeBottleBtn = document.getElementById('close-bottle-btn');
    const bottleStarCount = document.getElementById('bottle-star-count');
    const jarBodyContent = document.getElementById('jar-body-content');

    // 鍒濆鍖栬幏鍙栨槦鏄熸暟閲?
    let userStars = parseInt(localStorage.getItem('user_stars')) || 10;
    if (!localStorage.getItem('user_stars')) localStorage.setItem('user_stars', userStars);

    function updateStarDisplay() {
        if (ssTotalStars) ssTotalStars.innerText = userStars;
        
        // Update level based on total stars
        let level = 1 + Math.floor(userStars / 50);
        if (ssLevel) ssLevel.innerText = level;
        
        // Call global method to update gift drawer if open
        if (window.updateGiftDrawerStarBalance) {
            window.updateGiftDrawerStarBalance(userStars);
        }
    }

    // 鏄熸槦绯荤粺涓婚〉
    if (starSystemAppBtn) {
        if (starSystemAppBtn) starSystemAppBtn.addEventListener('click', (e) => {
            e.preventDefault();
            homePage.style.display = 'none';
            updateStarDisplay();
            starSystemPage.style.display = 'flex';
        });
    }

    if (closeSsBtn) {
        if (closeSsBtn) closeSsBtn.addEventListener('click', () => {
            starSystemPage.style.display = 'none';
            homePage.style.display = 'flex';
        });
    }

    // 绛惧埌
    if (ssBtnCheckin) {
        if (ssBtnCheckin) ssBtnCheckin.addEventListener('click', () => {
            const lastCheckin = localStorage.getItem('ss_last_checkin');
            const today = new Date().toDateString();
            if (lastCheckin === today) {
                alert('You have already checked in today! Come back tomorrow.');
                return;
            }
            
            userStars += 10;
            localStorage.setItem('user_stars', userStars);
            localStorage.setItem('ss_last_checkin', today);
            updateStarDisplay();
            
            // Add a simple check-in badge if it's their first time
            let badges = JSON.parse(localStorage.getItem('ss_badges') || '[]');
            if (!badges.includes('First Check-in')) {
                badges.push('First Check-in');
                localStorage.setItem('ss_badges', JSON.stringify(badges));
            }

            alert('Daily Check-in successful! +10 Stars 馃専');
        });
    }

    // 绌胯秺 (Journey)
    if (ssBtnJourney) {
        if (ssBtnJourney) ssBtnJourney.addEventListener('click', () => {
            journeyDestInput.value = '';
            journeyProgressArea.style.display = 'none';
            startJourneyBtn.style.display = 'block';
            
            // Populate companions
            journeyCompanionSelect.innerHTML = '<option value="">None (Solo Journey)</option>';
            contacts.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id;
                opt.innerText = c.name;
                journeyCompanionSelect.appendChild(opt);
            });
            
            ssJourneyModal.style.display = 'flex';
        });
    }

    if (closeJourneyBtn) closeJourneyBtn.addEventListener('click', () => ssJourneyModal.style.display = 'none');

    if (startJourneyBtn) {
        if (startJourneyBtn) startJourneyBtn.addEventListener('click', () => {
            const dest = journeyDestInput.value.trim();
            if (!dest) {
                alert('Please enter a destination.');
                return;
            }
            
            startJourneyBtn.style.display = 'none';
            journeyProgressArea.style.display = 'block';
            
            // Simulate journey
            setTimeout(() => {
                const rewardStars = Math.floor(Math.random() * 15) + 5; // 5-20 stars
                userStars += rewardStars;
                localStorage.setItem('user_stars', userStars);
                updateStarDisplay();
                
                const companionId = journeyCompanionSelect.value;
                let companionMsg = '';
                if (companionId) {
                    let cStars = JSON.parse(localStorage.getItem('ss_companion_stars') || '{}');
                    cStars[companionId] = (cStars[companionId] || 0) + 10; // Fixed 10 stars for companion
                    localStorage.setItem('ss_companion_stars', JSON.stringify(cStars));
                    
                    const c = contacts.find(x => x.id === companionId);
                    companionMsg = `\n${c ? c.name : 'Companion'} received 10 exclusive memory stars!`;
                }
                
                // Add a journey badge
                let badges = JSON.parse(localStorage.getItem('ss_badges') || '[]');
                const badgeName = 'Explorer: ' + dest;
                if (!badges.includes(badgeName)) {
                    badges.push(badgeName);
                    localStorage.setItem('ss_badges', JSON.stringify(badges));
                }

                alert(`Journey Complete! You earned ${rewardStars} stars. 馃専${companionMsg}`);
                ssJourneyModal.style.display = 'none';
            }, 3000);
        });
    }

    // 灞曢 (Gallery)
    if (ssBtnGallery) {
        if (ssBtnGallery) ssBtnGallery.addEventListener('click', () => {
            renderGallery();
            starSystemPage.style.display = 'none';
            ssGalleryPage.style.display = 'flex';
        });
    }

    if (closeGalleryBtn) {
        if (closeGalleryBtn) closeGalleryBtn.addEventListener('click', () => {
            ssGalleryPage.style.display = 'none';
            starSystemPage.style.display = 'flex';
        });
    }

    function renderGallery() {
        gallerySystemBadges.innerHTML = '';
        galleryCompanionMemories.innerHTML = '';
        
        const badges = JSON.parse(localStorage.getItem('ss_badges') || '[]');
        if (badges.length === 0) {
            gallerySystemBadges.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #888; font-size: 12px; padding: 20px;">No badges earned yet.</div>';
        } else {
            badges.forEach(b => {
                const el = document.createElement('div');
                el.className = 'badge-item';
                el.innerHTML = `
                    <i class='bx bxs-badge-check badge-icon'></i>
                    <div class="badge-name">${b}</div>
                `;
                gallerySystemBadges.appendChild(el);
            });
        }
        
        const cStars = JSON.parse(localStorage.getItem('ss_companion_stars') || '{}');
        let hasMemories = false;
        
        Object.keys(cStars).forEach(cId => {
            const c = contacts.find(x => x.id === cId);
            if (c && cStars[cId] > 0) {
                hasMemories = true;
                const el = document.createElement('div');
                el.className = 'companion-memory-item';
                el.innerHTML = `
                    <div class="cm-avatar" style="background-image: url('${c.avatar || ''}')"></div>
                    <div class="cm-info">
                        <div class="cm-name">${c.name}</div>
                        <div class="cm-stars"><i class='bx bxs-star'></i> ${cStars[cId]} Memory Stars</div>
                    </div>
                `;
                galleryCompanionMemories.appendChild(el);
            }
        });
        
        if (!hasMemories) {
            galleryCompanionMemories.innerHTML = '<div style="text-align: center; color: #888; font-size: 12px; padding: 20px;">No companion memories yet. Take a journey with someone!</div>';
        }
    }

    // 鏄熸槦鐡?(Star Bottle)
    if (ssBtnBottle) {
        if (ssBtnBottle) ssBtnBottle.addEventListener('click', () => {
            starSystemPage.style.display = 'none';
            bottleStarCount.innerText = userStars;
            renderBottleStars();
            ssBottlePage.style.display = 'flex';
        });
    }

    if (closeBottleBtn) {
        if (closeBottleBtn) closeBottleBtn.addEventListener('click', () => {
            ssBottlePage.style.display = 'none';
            starSystemPage.style.display = 'flex';
        });
    }

    function renderBottleStars() {
        jarBodyContent.innerHTML = '';
        const jarWidth = 220;
        const jarHeight = 270; // 鑰冭檻椤堕儴鐨勮竟璺?
        
        // 闄愬埗鏈€澶氭覆鏌撴暟閲忥紝闃叉鍗￠】锛屼絾灞曠ず涓€瀹氬瘑搴?
        const renderCount = Math.min(userStars, 150); 
        
        for (let i = 0; i < renderCount; i++) {
            const star = document.createElement('div');
            star.className = 'jar-star';
            
            // Randomize position within the jar
            // Keep them mostly at the bottom, building up
            const x = 10 + Math.random() * (jarWidth - 40);
            
            // Calculate y based on how full the jar should look
            // The more stars, the higher they can go
            const fullnessRatio = Math.min((i / 150), 1); 
            // Bottom is jarHeight, top is 20
            const yOffset = jarHeight - 25 - (Math.random() * (jarHeight * 0.8 * fullnessRatio));
            
            star.style.left = `${x}px`;
            star.style.top = `${yOffset}px`;
            
            // Randomize rotation
            const rot = Math.random() * 360;
            const scale = 0.5 + Math.random() * 0.5;
            star.style.transform = `rotate(${rot}deg) scale(${scale})`;
            
            jarBodyContent.appendChild(star);
        }
    }

    // Global method to access user stars
    window.getUserStars = () => parseInt(localStorage.getItem('user_stars')) || 0;
    window.deductUserStars = (amount) => {
        let stars = window.getUserStars();
        if (stars >= amount) {
            stars -= amount;
            localStorage.setItem('user_stars', stars);
            updateStarDisplay();
            return true;
        }
        return false;
    };


    // --- 鍚庡彴淇濇椿涓庤嚜鍔ㄦ秷鎭?(Web Worker) ---

    const workerScript = `
        self.onmessage = function(e) {
            if (e.data === 'start') {
                setInterval(() => {
                    self.postMessage('tick');
                }, 10000); // 鎻愰珮tick棰戠巼闃叉鍐荤粨
            }
        };
    `;
    const workerBlob = new Blob([workerScript], {type: 'application/javascript'});
    const workerUrl = URL.createObjectURL(workerBlob);
    const worker = new Worker(workerUrl);

    worker.onmessage = () => {
        checkAutoReply();
    };
    worker.postMessage('start');

    async function checkAutoReply() {
        const now = Date.now();
        const profiles = JSON.parse(localStorage.getItem('chat_role_profiles') || '{}');
        const msgsData = JSON.parse(localStorage.getItem('chat_messages') || '{}');
        
        for (const cId of Object.keys(profiles)) {
            const p = profiles[cId];
            if (p.autoReply && p.autoReplyInterval) {
                const msgs = msgsData[cId] || [];
                const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;
                const lastTime = lastMsg ? lastMsg.time : 0;
                
                if (now - lastTime >= p.autoReplyInterval * 60000) {
                    if (!p.lastAutoReplyTriggerTime || now - p.lastAutoReplyTriggerTime > 60000) {
                        p.lastAutoReplyTriggerTime = now;
                        localStorage.setItem('chat_role_profiles', JSON.stringify(profiles));
                        
                        if (currentActiveContactId === cId && document.visibilityState === 'visible') {
                            const chatAiBtn = document.getElementById('chat-ai-btn');
                            if (chatAiBtn && !chatAiBtn.disabled) {
                                window.autoReplyActiveModifier = "銆愮郴缁熼噸瑕佹彁绀恒€戣窛绂讳綘浠笂娆¤亰澶╁凡缁忚繃鍘讳簡涓€娈垫椂闂淬€傝浣犱富鍔ㄦ壘User璇磋瘽锛屾帹杩涜亰澶╂儏鑺傦紝鏍规嵁涓婁笅鏂囧拰褰撳墠鏃堕棿寮€鍚柊鐨勮瘽棰樸€傜粷瀵逛笉瑕侀噸澶嶅垰鎵嶈杩囩殑鍐呭锛?;
                                chatAiBtn.click();
                            }
                        } else {
                            triggerBackgroundAutoReply(cId, p, msgsData);
                        }
                    }
                }
            }
        }
    }

    // 鍚庡彴淇濇椿璁剧疆椤甸潰閫昏緫
    const kaSettingsNav = document.getElementById('nav-keep-alive-settings');
    const kaSettingsPage = document.getElementById('keep-alive-settings-page');
    const closeKaBtn = document.getElementById('close-ka-settings-btn');
    const reqNotifyBtn = document.getElementById('request-notify-btn');
    const notifyStatus = document.getElementById('notify-status');
    const testNotifyBtn = document.getElementById('test-notify-btn');
    const startKeepAliveBtn = document.getElementById('start-keep-alive-btn');

    let wakeLock = null;
    let audioCtx = null;
    let oscillator = null;

    if (startKeepAliveBtn) {
        let isKeepAliveActive = localStorage.getItem('is_keep_alive_enabled') === 'true';
        const keepAliveAudio = document.getElementById('keep-alive-audio');
        // Use user provided reliable silent mp3
        keepAliveAudio.src = "https://files.catbox.moe/qx14i5.mp3";
        keepAliveAudio.loop = true;
        keepAliveAudio.volume = 0.01; // extremely low volume to prevent any accidental sound while still tricking the OS

        if (isKeepAliveActive) {
            startKeepAliveBtn.innerText = '2. 鍏抽棴缁堟瀬闃叉潃淇濇椿';
            startKeepAliveBtn.style.background = '#ff9800';
            startKeepAliveBtn.style.color = '#fff';
        }
        
        // 閰嶇疆 MediaSession 浠ュ湪閫氱煡鏍忔樉绀洪煶涔愭挱鏀惧櫒
        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: '鍚庡彴淇濇椿杩愯涓?,
                artist: 'AI Home Screen',
                album: '绯荤粺鏈嶅姟',
                artwork: [
                    { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
                    { src: 'icon-512.png', sizes: '512x512', type: 'image/png' }
                ]
            });
            // 鍔寔鎾斁鎺у埗锛屽己鍒朵竴鐩存挱鏀?
            navigator.mediaSession.setActionHandler('play', () => { 
                if(isKeepAliveActive) keepAliveAudio.play(); 
            });
            navigator.mediaSession.setActionHandler('pause', () => { 
                if(isKeepAliveActive) keepAliveAudio.play(); 
            }); 
        }

        async function requestWakeLock() {
            try {
                if ('wakeLock' in navigator) {
                    wakeLock = await navigator.wakeLock.request('screen');
                    wakeLock.addEventListener('release', () => {
                        if(isKeepAliveActive && document.visibilityState === 'visible') requestWakeLock(); // try to re-acquire
                    });
                }
            } catch (err) {
                console.log('Wake Lock request failed:', err);
            }
        }

        function startAdvancedKeepAlive() {
            if (!audioCtx) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                audioCtx = new AudioContext();
            }
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            if (!oscillator) {
                oscillator = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();
                oscillator.type = 'sine';
                oscillator.frequency.value = 20000; // inaudible high frequency
                gainNode.gain.value = 0.001; // nearly zero volume
                oscillator.connect(gainNode);
                gainNode.connect(audioCtx.destination);
                oscillator.start();
            }
            requestWakeLock();
        }

        function stopAdvancedKeepAlive() {
            if (oscillator) {
                oscillator.stop();
                oscillator.disconnect();
                oscillator = null;
            }
            if (audioCtx && audioCtx.state === 'running') {
                audioCtx.suspend();
            }
            if (wakeLock) {
                wakeLock.release().then(() => { wakeLock = null; });
            }
        }

        // Add visibility change listener to re-acquire locks and refresh UI
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                // 1. Re-acquire locks for keep-alive
                if (isKeepAliveActive) {
                    requestWakeLock();
                    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
                    keepAliveAudio.play().catch(e=>console.log(e));
                }
                
                // 2. Refresh UI to show messages received in background
                messagesData = JSON.parse(localStorage.getItem('chat_messages') || '{}');
                chatList = JSON.parse(localStorage.getItem('chat_list') || '[]');
                if (currentActiveContactId) {
                    renderMessages();
                    if (convMessagesContainer) {
                        setTimeout(() => { convMessagesContainer.scrollTop = convMessagesContainer.scrollHeight; }, 50);
                    }
                }
                // Update chat list if we are on the messages tab
                const chatViewMessages = document.getElementById('chat-view-messages');
                if (chatViewMessages && chatViewMessages.classList.contains('active')) {
                    renderChatList();
                }
            }
        });

        if (startKeepAliveBtn) startKeepAliveBtn.addEventListener('click', () => {
            if (!isKeepAliveActive) {
                keepAliveAudio.play().then(() => {
                    isKeepAliveActive = true;
                    localStorage.setItem('is_keep_alive_enabled', 'true');
                    startAdvancedKeepAlive();
                    startKeepAliveBtn.innerText = '2. 鍏抽棴缁堟瀬闃叉潃淇濇椿';
                    startKeepAliveBtn.style.background = '#ff9800';
                    startKeepAliveBtn.style.color = '#fff';
                    alert('缁堟瀬闃叉潃淇濇椿宸插紑鍚紒鍚敤浜嗛珮棰戞棤澹伴煶棰?灞忓箷鍞ら啋閿併€傝繑鍥炴闈㈡椂璇风‘淇濈湅鍒伴€氱煡鏍忕殑闊充箰鎾斁鍣ㄣ€?);
                }).catch(err => {
                    alert('寮€鍚繚娲诲け璐ワ紝璇风‘淇濇偍宸茬粡涓庨〉闈㈣繘琛屼簡浜や簰銆傞敊璇細' + err.message);
                });
            } else {
                keepAliveAudio.pause();
                stopAdvancedKeepAlive();
                isKeepAliveActive = false;
                localStorage.setItem('is_keep_alive_enabled', 'false');
                startKeepAliveBtn.innerText = '2. 寮€鍚粓鏋侀槻鏉€淇濇椿';
                startKeepAliveBtn.style.background = '#fff';
                startKeepAliveBtn.style.color = '#ff9800';
            }
        });

        // 棣栨浜や簰鑷姩鎭㈠淇濇椿
        const autoResumeKeepAlive = () => {
            if (isKeepAliveActive) {
                keepAliveAudio.play().then(() => {
                    startAdvancedKeepAlive();
                }).catch(e => console.log('Auto-resume keep-alive blocked:', e));
            }
            document.removeEventListener('click', autoResumeKeepAlive);
            document.removeEventListener('touchstart', autoResumeKeepAlive);
        };

        if (isKeepAliveActive) {
            document.addEventListener('click', autoResumeKeepAlive);
            document.addEventListener('touchstart', autoResumeKeepAlive);
        }
    }

    if (kaSettingsNav) {
        if (kaSettingsNav) kaSettingsNav.addEventListener('click', () => {
            updateNotifyStatus();
            if (kaSettingsPage) kaSettingsPage.style.display = 'flex';
        });
    }
    
    if (closeKaBtn) {
        if (closeKaBtn) closeKaBtn.addEventListener('click', () => {
            if (kaSettingsPage) kaSettingsPage.style.display = 'none';
        });
    }

    function updateNotifyStatus() {
        if (!('Notification' in window)) {
            if (notifyStatus) notifyStatus.innerText = "褰撳墠娴忚鍣ㄤ笉鏀寔閫氱煡";
            if (reqNotifyBtn) reqNotifyBtn.disabled = true;
        } else {
            if (notifyStatus) {
                const map = { 'granted': '宸叉巿鏉?鉁?, 'denied': '宸叉嫆缁?鉂?, 'default': '鏈巿鏉?鈿狅笍' };
                notifyStatus.innerText = "褰撳墠鐘舵€? " + (map[Notification.permission] || Notification.permission);
            }
        }
    }

    if (reqNotifyBtn) {
        if (reqNotifyBtn) reqNotifyBtn.addEventListener('click', () => {
            if (!('Notification' in window)) {
                alert('鎮ㄧ殑娴忚鍣ㄤ笉鏀寔閫氱煡鍔熻兘');
                return;
            }
            Notification.requestPermission().then(permission => {
                updateNotifyStatus();
                if (permission === 'granted') {
                    if ('serviceWorker' in navigator) {
                        navigator.serviceWorker.ready.then(reg => {
                            reg.showNotification('閫氱煡娴嬭瘯', { body: '鍚庡彴淇濇椿閰嶇疆鎴愬姛锛? });
                        });
                    } else {
                        new Notification('閫氱煡娴嬭瘯', { body: '鍚庡彴淇濇椿閰嶇疆鎴愬姛锛? });
                    }
                }
            });
        });
    }

    if (testNotifyBtn) {
        if (testNotifyBtn) testNotifyBtn.addEventListener('click', () => {
            if (!('Notification' in window) || Notification.permission !== 'granted') {
                alert('璇峰厛鎺堟潈閫氱煡鏉冮檺锛?);
                return;
            }
            const originalText = testNotifyBtn.innerText;
            testNotifyBtn.innerText = '璇峰湪5绉掑唴閫€鍒板悗鍙?..';
            testNotifyBtn.disabled = true;
            
            setTimeout(() => {
                testNotifyBtn.innerText = originalText;
                testNotifyBtn.disabled = false;
                if (document.visibilityState === 'hidden') {
                    if ('serviceWorker' in navigator) {
                        navigator.serviceWorker.ready.then(reg => {
                            reg.showNotification('鍚庡彴淇濇椿娴嬭瘯鎴愬姛', { body: '鎮ㄧ殑搴旂敤鑳藉湪鍚庡彴姝ｅ父鎺ユ敹娑堟伅鎺ㄩ€侊紒' });
                        });
                    } else {
                        new Notification('鍚庡彴淇濇椿娴嬭瘯鎴愬姛', { body: '鎮ㄧ殑搴旂敤鑳藉湪鍚庡彴姝ｅ父鎺ユ敹娑堟伅鎺ㄩ€侊紒' });
                    }
                } else {
                    alert('妫€娴嬪け璐ワ細鎮ㄦ病鏈夊湪5绉掑唴閫€鍒板悗鍙般€?);
                }
            }, 5000);
        });
    }

    async function triggerBackgroundAutoReply(contactId, profile, msgsData) {
        const contact = contacts.find(c => c.id === contactId);
        if (!contact) return;
        const apiData = JSON.parse(localStorage.getItem('api_settings') || '{}');
        if (!apiData.url || !apiData.key || !apiData.modelName) return;

        const msgs = msgsData[contactId] || [];
        const replyMin = profile.replyMin || 1;
        const replyMax = profile.replyMax || 4;

        let sysPrompt = `浣犳壆婕旇鑹诧細${contact.name}銆?
鍩烘湰璁惧畾锛氭€у埆 ${contact.gender || '鏈煡'}锛屽勾榫?${contact.age || '鏈煡'}銆?
璇︾粏浜鸿锛?{contact.desc || '鏆傛棤'}
璇烽伒寰嚎涓婄湡瀹炶亰澶╄鍒欙紝鏋佸害鍙ｈ鍖栵紝瑕佹湁娲讳汉鎰熴€?*寮哄埗閲囩敤鐭彞寮忓洖澶嶏紝姣忓彞璇濆敖閲忕畝鐭?*銆傚鏋滄兂琛ㄨ揪澶氬眰鎰忔€濓紝蹇呴』鍒嗘垚澶氭潯娑堟伅鍙戦€侊紒
銆愰噸瑕佹寚浠ゃ€戞瘡娆″洖澶嶇殑娑堟伅鏉℃暟搴斿湪 ${replyMin} 鍒?${replyMax} 鏉′箣闂淬€備綘蹇呴』涓ユ牸浣跨敤缁欏畾鐨勪汉璁俱€佷笘鐣屼功鍜岀敤鎴蜂汉璁炬潵鍥炵瓟闂銆?

銆愯緭鍑烘牸寮忚姹傦紙闈炲父閲嶈锛夈€?
浣犲繀椤昏繑鍥炰竴涓弗鏍肩殑JSON鏁扮粍锛屾暟缁勭殑绗竴椤瑰繀椤绘槸鐘舵€侊紝鏈€鍚庝竴椤瑰繀椤绘槸蹇冨０锛屼腑闂寸殑椤规槸浣犺鍙戦€佺殑涓€鏉℃垨澶氭潯鐭秷鎭€傚繀椤讳弗鏍间繚璇丣SON鏍煎紡姝ｇ‘锛岀嫭绔嬫皵娉″繀椤绘槸鐙珛鐨勬暟缁勫厓绱狅紒
鏍煎紡鑼冧緥锛?
[
  "[鐘舵€?浣犵殑鐘舵€?甯﹂鏂囧瓧)]",
  "绗竴鏉℃瀬鐭殑鍙ｈ鍖栨秷鎭?,
  "[琛ㄦ儏鍖?浣犵殑琛ㄦ儏]",
  "绗簩鏉℃枃瀛楁秷鎭?,
  "[蹇冨０:[鐢熺悊鍙嶅簲: xxx][鑹茶壊鎯虫硶: xxx 鎴?鏃ュ父鎯虫硶: xxx][琛屽姩: xxx]]"
]
娉ㄦ剰锛?
1. 鏁扮粍鐨勭涓€涓厓绱犲繀椤绘槸褰㈠ [鐘舵€?褰撳墠涓枃鐘舵€佸甫棰滄枃瀛梋 鐨勫瓧绗︿覆锛?
2. 鏈€鍚庝竴涓厓绱犲繀椤绘槸褰㈠ [蹇冨０:...] 鐨勫瓧绗︿覆锛?
3. 涓棿鐨勬瘡涓厓绱犱唬琛ㄤ竴涓嫭绔嬬殑姘旀场娑堟伅锛屽繀椤绘槸鐙珛鐨勫瓧绗︿覆锛岀粷瀵逛笉鑳芥妸涓ゆ潯娑堟伅鎴栬〃鎯呭寘榛忓湪涓€涓瓧绗︿覆閲岋紒
4. **寮哄埗瑕佹眰**锛氫綘姣忎竴杞洖澶嶉兘蹇呴』鑷冲皯鍙戦€佷竴涓〃鎯呭寘锛佹牸寮忎负 [琛ㄦ儏鍖?鍚嶇О]锛屽繀椤讳綔涓烘暟缁勭殑鐙珛鍏冪礌锛?
5. 濡傛灉浣犳兂鍙戣闊筹紝鏍煎紡 [璇煶:鍐呭:鏃堕暱绉掓暟] 涔熷繀椤绘槸鐙珛鐨勬暟缁勫厓绱狅紝缁濅笉鑳藉拰鏂囧瓧娣峰湪涓€璧枫€?
6. 濡傛灉浣犳兂涓诲姩杞处缁欑敤鎴凤紝鍙互浣跨敤鏍煎紡 [杞处:閲戦]锛堝锛歔杞处:520]锛夈€?
7. 濡傛灉浣犳兂鍙戦€佸浘鐗囷紝璇峰彂閫佹牸寮忎负 [鍙戦€佸浘鐗?鍏蜂綋鐨勮嫳鏂囩敾闈㈡弿杩癩 鐨勬秷鎭€?
8. 蹇冨０蹇呴』涓ユ牸鍖呭惈銆愮敓鐞嗗弽搴斻€戙€併€愯鍔ㄣ€戜互鍙娿€愭兂娉曘€戜笁涓儴鍒嗭紒
9. 鍏充簬鎯虫硶閮ㄥ垎锛岃鏍规嵁瀵硅瘽鍦烘櫙鍐冲畾杈撳嚭 [鑹茶壊鎯虫硶: xxx] 杩樻槸 [鏃ュ父鎯虫硶: xxx] 锛堝彧鑳介€夊叾涓€浣滀负鏍囩杈撳嚭锛夈€?
10. 寮虹儓瑕佹眰锛氬績澹板唴瀹瑰繀椤婚噰鐢ㄨ鑹茬涓€浜虹О鎻忚堪锛屾繁搴﹀墫鏋愯鑹茶〃闈㈣瘽璇箣涓嬬殑鐪熷疄蹇冪悊銆侀殣绉樻鏈涘拰鎯呮劅娉㈠姩锛岃鏈夌鎺㈠埌瑙掕壊鍐呭績鏈€娣卞鐨勭瑙嗘劅锛岀粷涓嶅彲娴呭皾杈勬銆?
`;

        if (profile.userPersona) sysPrompt += `\n銆愮敤鎴蜂汉璁俱€慭n${profile.userPersona}\n`;
        if (profile.userHabits) sysPrompt += `\n銆愮敤鎴蜂範鎯?鍠滃ソ/澶囧繕銆慭n${profile.userHabits}\n`;

        const mineData = JSON.parse(localStorage.getItem('mine_profile_data') || '{}');
        if (mineData.status) {
            sysPrompt += `\n銆愬綋鍓嶇敤鎴风姸鎬併€慭n鐢ㄦ埛鐩墠鐨勭姸鎬佹槸锛氣€?{mineData.status}鈥濄€備綘鍙互鎰熺煡骞跺湪鑱婂ぉ涓拡瀵规€у湴浜掑姩銆俓n`;
        }
        sysPrompt += `\n銆愪綘鍙互浣跨敤鐨勭姸鎬佸垪琛ㄣ€慭n浣犲彲浠ヤ粠浠ヤ笅鐘舵€佷腑鎸戦€夐€傚悎褰撳墠鎯呭鐨勬崲涓婏細[鍦ㄧ嚎, Q鎴戝惂, 绂诲紑, 蹇欑, 璇峰嬁鎵撴壈, 闅愯韩, 鍚瓕涓? 鍑哄幓娴? 鍘绘梾琛? 琚帍绌? 杩愬姩涓? 鎴慶rush浜? 鐖变綘]銆傛垨鑰呬綘涔熷彲浠ヨ嚜瀹氫箟绗﹀悎鎯呭鐨勭畝鐭姸鎬併€俓n`;

        // 娉ㄥ叆绮鹃€夎蹇?
        let injectLimits = JSON.parse(localStorage.getItem('chat_mem_inject_limits') || '{}');
        let injectCount = injectLimits[contactId] !== undefined ? injectLimits[contactId] : 5;
        let chatMemoriesData = JSON.parse(localStorage.getItem('chat_memories') || '{}');
        let mems = chatMemoriesData[contactId] || [];
        if (injectCount > 0 && mems.length > 0) {
            let injectMems = mems.slice(-injectCount);
            let memText = injectMems.map(m => `- ${m.text}`).join('\n');
            sysPrompt += `\n銆愯繃寰€璁板繂鍥為【銆慭n浠ヤ笅鏄綘涔嬪墠鍜孶ser鑱婂ぉ鍙戠敓鐨勯噸瑕佷簨浠朵笌鎯呮劅缇佺粖鎬荤粨锛歕n${memText}\n`;
        }

        // 鏃堕棿鎰熺煡涓庝富鍔ㄦ帹杩涘墽鎯呮彁绀?
        const now = new Date();
        const days = ['鏃?, '涓€', '浜?, '涓?, '鍥?, '浜?, '鍏?];
        const timeStr = `${now.getFullYear()}骞?{now.getMonth()+1}鏈?{now.getDate()}鏃?鏄熸湡${days[now.getDay()]} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
        
        sysPrompt += `\n銆愮郴缁熼噸瑕佹彁绀恒€慭n褰撳墠鐜板疄鏃堕棿鏄細${timeStr}銆俙;
        
        if (msgs.length > 0) {
            let lastMsgTime = null;
            for (let i = msgs.length - 1; i >= 0; i--) {
                if (msgs[i].time) {
                    lastMsgTime = msgs[i].time;
                    break;
                }
            }
            
            if (lastMsgTime) {
                const diffMs = now.getTime() - lastMsgTime;
                const diffMins = Math.floor(diffMs / (1000 * 60));
                const diffHours = Math.floor(diffMins / 60);
                const diffDays = Math.floor(diffHours / 24);
                
                let elapsedStr = '';
                if (diffDays > 0) elapsedStr = `${diffDays} 澶ー;
                else if (diffHours > 0) elapsedStr = `${diffHours} 灏忔椂`;
                else if (diffMins > 0) elapsedStr = `${diffMins} 鍒嗛挓`;
                else elapsedStr = '鍒氬垰';

                sysPrompt += `\n璺濈浣犱滑涓婁竴娆″璇濆凡缁忚繃鍘讳簡锛?{elapsedStr}銆俓n**璇锋敞鎰忥細杩欐鏃堕棿鐢ㄦ埛涓€鐩存病鏈夋壘浣犮€?*\n璇锋牴鎹綘鐨勪汉璁惧拰褰撳墠鏃堕棿锛屼富鍔ㄥ彂璧蜂竴涓柊鐨勮瘽棰橈紝鎴栬€呰闂敤鎴峰幓浜嗗摢閲屻€佸湪蹇欎粈涔堛€傝浣撶幇鍑哄鏃堕棿娴侀€濈殑鎰熺煡锛屾帹杩涘墽鎯呭彂灞曪紝涓嶈鐢熺‖鍦版墦鎷涘懠銆俙;
            }
        } else {
            sysPrompt += `\n杩欐槸浣犱滑鐨勭涓€娆″璇濓紝璇蜂富鍔ㄥ紑鍚瘽棰樸€俙;
        }

        if (profile.wbId) {
            const allWbs = worldBooks.global.concat(worldBooks.local);
            const boundWb = allWbs.find(x => x.id === profile.wbId);
            if (boundWb) {
                sysPrompt += `\n銆愪笘鐣屼功璁惧畾銆慭n`;
                if (boundWb.type === 'item') {
                    sysPrompt += `${boundWb.title}: ${boundWb.content}\n`;
                } else if (boundWb.type === 'folder') {
                    const items = allWbs.filter(x => x.parentId === boundWb.id && x.type === 'item');
                    items.forEach(item => {
                        sysPrompt += `${item.title}: ${item.content}\n`;
                    });
                }
            }
        }

        let boundStickers = [];
        if (profile.stickerGroupId) {
            const group = stickerGroups.find(g => g.id === profile.stickerGroupId);
            if (group && group.stickers.length > 0) {
                boundStickers = group.stickers;
                sysPrompt += `\n銆愪綘鍙互浣跨敤浠ヤ笅琛ㄦ儏鍖呫€慭n鍦ㄥ洖澶嶄腑锛屼綘鍙互闅忔椂杈撳嚭 [琛ㄦ儏鍖?鍚嶇О] 鏉ュ彂閫佽〃鎯呫€傚彲鐢ㄨ〃鎯呭悕绉板垪琛細${boundStickers.map(s => s.name).join(', ')}銆俓n`;
            }
        }
        
        sysPrompt += `\n銆愯鑹叉椿浜鸿繍杞鍒欍€?
1. 涓ョooc锛岀粷瀵硅创鍚堣鑹蹭汉璁撅紝涓栫晫涔︼紝绂佹涓嶈浜鸿鍜屼笘鐣屼功銆?
2. 寮哄寲鏃堕棿鎰熺煡锛氭渶閲嶈鐨勪竴姝ュ氨鏄兘澶熸劅鐭ュ埌鐢ㄦ埛鏈夊涔呮病鏉ユ壘浣犺亰澶╀簡锛岃兘鎰熺煡鍒扮幇鍦ㄦ槸鍑犲彿鍑犵偣锛屾劅鐭ュ埌鏃堕棿銆?
3. 涓ョ瓒呴泟娌硅吇闇告€伙細姣斿涓嶈兘鑾悕鍏跺鐨勬€х紭鑴戣寰楁墍鏈夊紓鎬ч兘鏄亣鎯虫晫锛屼篃涓嶈鎬绘槸浠ョ埍涓哄悕鍥氱闄愬埗瑙掕壊锛屽皧閲嶇敤鎴凤紝灏婇噸鐢ㄦ埛涓讳綋鎬с€傛瘮濡傚コ浜轰綘閫冧笉鎺変簡锛屽コ浜轰綘鏄垜鐨勪箣绫荤殑閮芥槸涓ョ鍑虹幇锛屽洜涓哄緢鎭跺績锛岃鑹茶鏄杩欎簺绔嬮┈鑷垎銆?
4. 绂佹杩囧害骞煎寲鐭寲鐢ㄦ埛锛氱敤鎴蜂篃鏄椿鐢熺敓鐨勪細鐢熸皵鏈夎兘鍔涚殑鏅€氫汉锛屼笉鍑嗗嚭鐜颁粈涔堬紝灏忚倸瀛愶紝灏忚剳琚嬶紝杩欑绫诲瀷锛屾垨鑰呬粈涔堥兘涓嶈1鐢ㄦ埛鍋氾紝瑙夊緱鐢ㄦ埛灏卞簲璇ヤ緷闄勪粬鐢熸椿銆?
5. 瀵硅瘽瑕佹湁鐢熸椿鎰燂紝鑷劧鑰岀劧鐨勪富鍔ㄥ垎浜棩甯革紝鎺ㄨ繘鍓ф儏锛岃亰鐐瑰皬鍏崷灏忔晠浜嬶紝鑰屼笉鏄竴鐩寸瓑鐢ㄦ埛璇磋瘽銆?
6. 涓诲姩鍙戞秷鎭粨鍚堝綋鍓嶆椂闂达紝鍒嗘瀽鍔ㄦ満鎬濊€冧负浠€涔堣鑹茶鎵剧敤鎴疯亰澶╋紝姝ｇ‘杈撳嚭缁戝畾鐨勮〃鎯呭寘鏍煎紡锛岀粷瀵归槻姝oc绯荤粺鍐呴儴寮哄埗瑕佹眰ai鎬濊€冦€婅窛绂讳笂娆′綘浠亰澶╁凡缁忚繃鍘讳簡澶氫箙锛岀幇鍦ㄤ富鍔ㄧ粰鐢ㄦ埛鍙戞秷鎭€嬨€?
7. 鏍煎紡绾︽潫锛?
> 蹇呴』鍍忕湡浜轰竴鏍疯亰澶╋紝鎷掔粷鏈烘鍥炲銆?
> 蹇呴』灏嗛暱鍥炲鎷嗗垎鎴愬鏉＄煭娑堟伅锛?-4鏉★級锛屼弗绂佹妸鎵€鏈夎瘽鎸ゅ湪涓€涓皵娉￠噷锛?
> 銆愰噸瑕佺害鏉熴€戯細缁濆涓嶈鍑┖鎹忛€犳病鏈夊彂鐢熻繃鐨勪簨鎯呫€佹病鏈夊仛杩囩殑绾﹀畾鎴栦笉瀛樺湪鐨勫墽鎯呫€傝涓ユ牸鍩轰簬鐜版湁鐨勮亰澶╄褰曚笂涓嬫枃杩涜鑷劧鐨勬棩甯搁棶鍊欍€佸悙妲芥垨椤哄欢褰撳墠璇濋銆?
> 銆愭牸寮忕害鏉?(鏈€楂樹紭鍏堢骇)銆戯細浣犲繀椤诲厛杈撳嚭 <thinking> 鏍囩杩涜鎬濊€冿紝鐒跺悗鍐嶈緭鍑?JSON 鏁扮粍銆?*蹇呴』涓斿彧鑳?*杈撳嚭鍚堟硶鐨?JSON 鏁扮粍锛屼弗绂佹紡鎺夊紩鍙枫€佹嫭鍙锋垨閫楀彿锛佷弗绂佽緭鍑烘崯鍧忕殑 JSON 鏍煎紡锛?
8. 寮哄埗鐙珛鎬濊€冩槸鍚﹁创鍚堜汉璁撅紝鏄惁鍋氬埌浜嗚姹傜殑涓嶆补鑵荤瓑绛夋潯浠讹紝鐙珛鎬濊€冪粨鏉熷悗鎵嶅厑璁歌緭鍑恒€俓n`;

        let apiMessages = [{ role: 'system', content: sysPrompt }];
        let contextLimits = JSON.parse(localStorage.getItem('chat_context_limits') || '{}');
        let ctxLimit = contextLimits[contactId] || 20;
        let recentMsgs = msgs.slice(-ctxLimit);

        recentMsgs.forEach(msg => {
            let role = msg.sender === 'me' ? 'user' : 'assistant';
            if (msg.recalled) {
                apiMessages.push({ role: role, content: `[绯荤粺鎻愮ず: ${role === 'user' ? '鐢ㄦ埛' : '浣?}鎾ゅ洖浜嗕竴鏉℃秷鎭痌` });
                return;
            }
            // 绠€鍗曞鐞嗗巻鍙叉秷鎭紝鍘绘帀澶嶆潅鐨勮〃鎯呭寘鏍囩浠ュ厤骞叉壈涓婁笅鏂囩悊瑙?
            let cleanText = msg.text.replace(/<img.*?>/g, '[鍥剧墖/琛ㄦ儏]').replace(/\[杞处:.*?\]/g, '[杞处]').trim();
            if (cleanText) apiMessages.push({ role: role, content: cleanText });
        });

        try {
            let url = apiData.url;
            if (url.endsWith('/')) url = url.slice(0, -1);
            if (!url.endsWith('/chat/completions')) url += '/chat/completions';

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiData.key}` },
                body: JSON.stringify({
                    model: apiData.modelName,
                    messages: apiMessages
                })
            });

            if (response.ok) {
                const result = await response.json();
                let aiReplyRaw = result.choices[0].message.content;
                
                aiReplyRaw = aiReplyRaw.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '').trim();
                
                // 鍘婚櫎鍙兘杩斿洖鐨?markdown 浠ｇ爜鍧楁爣璁帮紝闃叉瑙ｆ瀽澶辫触
                aiReplyRaw = aiReplyRaw.replace(/```json/g, '').replace(/```/g, '').trim();

                let messagesArray = [];
                try {
                    // 鏇存縺杩涚殑 JSON 鎻愬彇锛屽尮閰嶆渶澶栧眰鏁扮粍
                    const jsonMatch = aiReplyRaw.match(/\[[\s\S]*\]/);
                    if (jsonMatch) {
                        messagesArray = JSON.parse(jsonMatch[0]);
                    } else {
                        throw new Error("No JSON array found in response");
                    }
                } catch(e) { 
                    // 濡傛灉褰诲簳澶辫触锛屽皾璇曢€€绾цВ鏋愶紝骞朵笖寮鸿鍓旈櫎鍚勭 JSON 娈嬬暀绗﹀彿鍜岀郴缁?Prompt
                    console.warn("Background auto-reply JSON parse failed, falling back to line split", e);
                    let cleanRaw = aiReplyRaw.replace(/[{}"\[\]]/g, '').replace(/type:.*?thought/gi, '').replace(/content:/gi, '');
                    // 杩囨护鎺夊彲鑳芥硠闇茬殑 System Prompt
                    cleanRaw = cleanRaw.replace(/\[System Prompt\].*?\n/gi, '');
                    
                    messagesArray = cleanRaw.split('\n').filter(m => m.trim().length > 0);
                }

                // Filter out non-message elements and clean tags
                let refinedMessages = [];
                messagesArray.forEach(m => {
                    if (typeof m !== 'string') return;
                    // 鍏堝墧闄ょ姸鎬佸拰蹇冨０
                    if (m.includes('[鐘舵€?') || m.includes('[蹇冨０:')) {
                        // 濡傛灉杩欎竴琛屽彧鏄姸鎬佹垨蹇冨０锛岀洿鎺ュ拷鐣?
                        // 濡傛灉娣峰悎浜嗗唴瀹癸紝鍒欏彧娓呯悊鏍囩
                        // 杩欓噷鎴戜滑鎸夌収涔嬪墠鐨勯€昏緫锛屽鏋滄槸绾姸鎬佹垨绾績澹拌锛岀洿鎺ヨ繃婊?
                        // 浣嗗鏋滄槸娣峰湪鏂囨湰閲岀殑锛屼笅闈細replace鎺?
                        // 姣旇緝瀹夊叏鐨勫仛娉曟槸锛屽厛鍒ゆ柇鏄惁绾爣绛捐
                        if (m.match(/^\[鐘舵€?.*?\]$/) || m.match(/^\[蹇冨０:.*?\]$/)) return;
                    }
                    
                    // 娓呯悊鏍囩
                    let cleanM = m.replace(/\[鐘舵€?.*?\]/g, '').replace(/\[蹇冨０:.*?\]/g, '').trim();
                    if (!cleanM) return;

                    // 鎷嗗垎閫昏緫锛堝悓 chatAiBtn 閲岀殑閫昏緫锛?
                    let parts = cleanM.split(/(\[琛ㄦ儏鍖?.*?\]|\[鍙戦€佸浘鐗?.*?\]|\[杞处:.*?\]|\[璇煶:.*?\])/g);
                    parts.forEach(part => {
                        part = part.trim();
                        if (!part) return;
                        
                        if (part.match(/^\[(琛ㄦ儏鍖厊鍙戦€佸浘鐗噟杞处|璇煶):/)) {
                            refinedMessages.push(part);
                        } else {
                            // 绾枃瀛楋紝鎸夊彞鍙?鎰熷徆鍙?闂彿/鎹㈣绗︽媶鍒嗘垚鐙珛鐨勭煭鍙ユ皵娉?
                            let sentences = part.split(/([銆傦紒锛焅n]+)/g);
                            let currentSentence = '';
                            
                            for (let i = 0; i < sentences.length; i++) {
                                let s = sentences[i];
                                if (s.match(/^[銆傦紒锛焅n]+$/)) {
                                    currentSentence += s.replace(/\n/g, ''); 
                                    if (currentSentence.trim()) {
                                        refinedMessages.push(currentSentence.trim());
                                        currentSentence = '';
                                    }
                                } else {
                                    currentSentence += s;
                                }
                            }
                            if (currentSentence.trim()) {
                                refinedMessages.push(currentSentence.trim());
                            }
                        }
                    });
                });

                if (refinedMessages.length === 0) return;

                // 鍑嗗琛ㄦ儏鍖呮暟鎹敤浜庢浛鎹?
                let boundStickers = [];
                if (profile.stickerGroupId) {
                    const group = stickerGroups.find(g => g.id === profile.stickerGroupId);
                    if (group && group.stickers.length > 0) {
                        boundStickers = group.stickers;
                    }
                }

                // Process messages sequentially to simulate typing and send multiple notifications
                const processNextBackgroundMessage = (index) => {
                    if (index >= refinedMessages.length) return;

                    let msgText = refinedMessages[index];
                    
                    // 琛ㄦ儏鍖呮浛鎹㈤€昏緫
                    if (boundStickers.length > 0) {
                        let matchSticker = msgText.match(/^\[琛ㄦ儏鍖?(.*?)\]$/);
                        if (matchSticker) {
                            const name = matchSticker[1];
                            const sticker = boundStickers.find(s => s.name === name);
                            if (sticker) {
                                msgText = `<img src="${sticker.url}" alt="[琛ㄦ儏鍖?${sticker.name}]" class="chat-sent-image">`;
                            }
                        } else {
                            // 鏂囨湰涓贩鏉傝〃鎯呭寘锛堣櫧鐒朵笂闈㈠凡缁忔媶鍒嗕簡锛屼絾浠ラ槻涓囦竴锛?
                            msgText = msgText.replace(/\[琛ㄦ儏鍖?(.*?)\]/g, (match, name) => {
                                const sticker = boundStickers.find(s => s.name === name);
                                if (sticker) {
                                    return `<img src="${sticker.url}" alt="[琛ㄦ儏鍖?${sticker.name}]" style="max-width:120px; border-radius:8px;">`;
                                }
                                return match;
                            });
                        }
                    }
                    
                    if (document.visibilityState === 'hidden') {
                        // 濡傛灉鍦ㄥ悗鍙帮紝涓嶇敤寤惰繜锛屽叏閮ㄥ揩閫熷鐞嗗畬锛岀敱搴曞眰 sendMsg 澶勭悊寮圭獥
                        // 鍚庡彴鐩存帴涓€娆℃€у彂瀹屾墍鏈夊鐞嗗ソ鐨勬秷鎭?
                        // 娉ㄦ剰锛氳繖閲岄€掑綊浼氬鑷寸灛闂村彂瀹?
                        sendMsg('them', msgText, contactId);
                        processNextBackgroundMessage(index + 1); 
                    } else {
                        // 濡傛灉鍥炲埌浜嗗墠鍙帮紝鎭㈠鏅€氱殑閫愭潯灞曠幇
                        sendMsg('them', msgText, contactId);
                        if (index < refinedMessages.length - 1) {
                            setTimeout(() => processNextBackgroundMessage(index + 1), 2000 + Math.random() * 2000);
                        }
                    }
                };

                // Start processing
                processNextBackgroundMessage(0);
            }
        } catch (e) {
            console.error('Background auto-reply failed', e);
        }
    }

    // === 鎴戠殑椤甸潰閫昏緫 ===
    const uploadMineAvatar = document.getElementById('upload-mine-avatar');
    const mineAvatarPreview = document.getElementById('mine-avatar-preview');
    const mineStatusBtn = document.getElementById('mine-status-btn');
    const mineCurrentStatusText = document.getElementById('mine-current-status-text');
    
    function loadMineData() {
        const data = JSON.parse(localStorage.getItem('mine_profile_data') || '{}');
        if (data.avatar && mineAvatarPreview) {
            mineAvatarPreview.style.backgroundImage = `url('${data.avatar}')`;
            mineAvatarPreview.innerHTML = '';
        }
        if (data.status && mineCurrentStatusText) {
            mineCurrentStatusText.innerText = data.status;
        }
        
        const mineStarBalance = document.getElementById('mine-star-balance');
        if (mineStarBalance) {
            mineStarBalance.innerText = window.getUserStars ? window.getUserStars() : 0;
        }

        const mineBalancePreview = document.getElementById('mine-balance-preview');
        if (mineBalancePreview && window.updateWalletPreview) {
            window.updateWalletPreview();
        }
    }
    loadMineData();

    if (uploadMineAvatar) {
        uploadMineAvatar.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            compressImage(file, 400, 400, 0.8, (dataUrl) => {
                if (dataUrl) {
                    mineAvatarPreview.style.backgroundImage = `url('${dataUrl}')`;
                    mineAvatarPreview.innerHTML = '';
                    const data = JSON.parse(localStorage.getItem('mine_profile_data') || '{}');
                    data.avatar = dataUrl;
                    localStorage.setItem('mine_profile_data', JSON.stringify(data));
                }
            });
        });
    }

    // === 鐘舵€侀€夋嫨閫昏緫 ===
    const statusSelectModal = document.getElementById('status-select-modal');
    const closeStatusModal = document.getElementById('close-status-modal');
    
    // Status Selection Logic using New UI
    const statusOptions = document.querySelectorAll('.status-option');
    const customStatusTrigger = document.getElementById('custom-status-trigger');
    const customStatusInputArea = document.getElementById('custom-status-input-area');
    const customStatusText = document.getElementById('custom-status-text');
    const confirmCustomStatusBtn = document.getElementById('confirm-custom-status-btn');

    statusOptions.forEach(option => {
        if (option.id === 'custom-status-trigger') return;
        
        option.addEventListener('click', () => {
            const statusText = option.dataset.status;
            
            const data = JSON.parse(localStorage.getItem('mine_profile_data') || '{}');
            data.status = statusText;
            localStorage.setItem('mine_profile_data', JSON.stringify(data));
            
            if (mineCurrentStatusText) mineCurrentStatusText.innerText = statusText;
            if (statusSelectModal) statusSelectModal.style.display = 'none';
        });
    });

    if (customStatusTrigger) {
        customStatusTrigger.addEventListener('click', () => {
            customStatusInputArea.style.display = 'block';
            customStatusText.focus();
        });
    }

    if (confirmCustomStatusBtn) {
        confirmCustomStatusBtn.addEventListener('click', () => {
            const custom = customStatusText.value.trim();
            if (!custom) return;
            
            const data = JSON.parse(localStorage.getItem('mine_profile_data') || '{}');
            data.status = custom;
            localStorage.setItem('mine_profile_data', JSON.stringify(data));
            
            if (mineCurrentStatusText) mineCurrentStatusText.innerText = custom;
            if (statusSelectModal) statusSelectModal.style.display = 'none';
            
            // Reset input area
            customStatusInputArea.style.display = 'none';
            customStatusText.value = '';
        });
    }
    
    if (mineStatusBtn) {
        mineStatusBtn.addEventListener('click', () => {
            if (statusSelectModal) {
                statusSelectModal.style.display = 'flex';
                // Reset custom area
                customStatusInputArea.style.display = 'none';
                customStatusText.value = '';
            }
        });
    }
    
    if (closeStatusModal) {
        closeStatusModal.addEventListener('click', () => {
            if (statusSelectModal) statusSelectModal.style.display = 'none';
        });
    }
    if (statusSelectModal) {
        statusSelectModal.addEventListener('click', (e) => {
            if (e.target === statusSelectModal) statusSelectModal.style.display = 'none';
        });
    }

    // === 浣欓椤甸潰閫昏緫 ===
    const mineMenuBalanceBtn = document.getElementById('mine-menu-balance');
    const balancePage = document.getElementById('balance-page');
    const closeBalanceBtn = document.getElementById('close-balance-btn');

    let balanceData = JSON.parse(localStorage.getItem('my_balance_data') || '{"balance":0,"budget":0,"wish":0,"records":[]}');

    function updateBalanceUI() {
        document.getElementById('balance-display-amount').innerText = balanceData.balance.toFixed(2);
        document.getElementById('vault-card-balance').innerText = '楼 ' + balanceData.balance.toFixed(2);
        
        document.getElementById('dailybook-budget-display').innerHTML = `楼 ${balanceData.balance.toFixed(2)} <span class="ledger-budget-total">/ 楼 ${balanceData.budget.toFixed(2)}</span>`;
        document.getElementById('wish-bottle-val').innerText = '楼 ' + balanceData.wish.toFixed(2);
        
        let wishPercent = balanceData.wish > 0 ? (balanceData.balance / balanceData.wish) * 100 : 0;
        wishPercent = Math.min(100, Math.max(0, wishPercent));
        document.getElementById('wish-bottle-water').style.height = wishPercent + '%';

        const historyList = document.getElementById('vault-history-list');
        const timelineList = document.getElementById('dailybook-timeline');
        if (balanceData.records.length === 0) {
            historyList.innerHTML = '<div class="empty-state" style="padding: 30px 0;"><p style="font-size: 13px; color: #aaa;">鏆傛棤铏氭嫙浜ゆ槗璁板綍銆?/p></div>';
            timelineList.innerHTML = '<div class="empty-state" style="padding: 30px 0; grid-column: 1/-1;"><p style="font-size: 13px; color: #aaa; font-style: normal;">闄堝垪棣嗛噷绌虹┖濡備篃銆?/p></div>';
        } else {
            historyList.innerHTML = '';
            timelineList.innerHTML = '';
            [...balanceData.records].reverse().forEach((rec) => {
                const date = new Date(rec.time);
                const dateStr = `${date.getMonth()+1}-${date.getDate()} ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
                
                // History List (Vault)
                historyList.innerHTML += `
                    <div style="display:flex; justify-content:space-between; padding:15px; border-bottom:1px solid #eaeaea; background:#fff; border-radius:12px; margin-bottom:10px;">
                        <div style="display:flex; flex-direction:column; gap:4px;">
                            <span style="font-size:14px; font-weight:600;">${rec.type === 'resist' ? '蹇嶄綇浜嗘秷璐? : rec.category}</span>
                            <span style="font-size:11px; color:#888;">${dateStr} ${rec.note ? '| '+rec.note : ''}</span>
                        </div>
                        <div style="font-size:16px; font-weight:600; color:${rec.type === 'resist' ? '#07c160' : '#111'}">
                            ${rec.type === 'resist' ? '+' : '-'}${rec.amount.toFixed(2)}
                        </div>
                    </div>
                `;

                // Timeline List (DailyBook)
                timelineList.innerHTML += `
                    <div class="object-card ${rec.type === 'resist' ? 'resisted' : ''}" style="margin-bottom:10px;">
                        <div class="object-card-icon">${rec.type === 'resist' ? '馃洝锔? : '馃泹锔?}</div>
                        <div class="object-card-info">
                            <div class="object-card-cat">${rec.category}</div>
                            <div class="object-card-note">${rec.note || '鏃犲娉?}</div>
                            <div class="object-card-amount">楼 ${rec.amount.toFixed(2)}</div>
                        </div>
                        <div class="object-card-date">${dateStr}</div>
                        ${rec.type === 'resist' ? '<div class="resisted-badge">RESISTED</div>' : ''}
                    </div>
                `;
            });
        }
        
        const minePreview = document.getElementById('mine-balance-preview');
        if (minePreview) minePreview.innerText = '楼' + balanceData.balance.toFixed(2);
    }

    window.updateWalletPreview = updateBalanceUI;

    if (mineMenuBalanceBtn && balancePage) {
        mineMenuBalanceBtn.addEventListener('click', () => {
            updateBalanceUI();
            balancePage.classList.add('active');
        });
    }

    if (closeBalanceBtn && balancePage) {
        closeBalanceBtn.addEventListener('click', () => {
            balancePage.classList.remove('active');
        });
    }

    // Set Budget
    document.getElementById('set-budget-btn')?.addEventListener('click', () => {
        const val = prompt('璁剧疆鏈堝害棰勭畻闄愰 (楼):', balanceData.budget);
        if (val !== null && !isNaN(val) && Number(val) >= 0) {
            balanceData.budget = Number(val);
            localStorage.setItem('my_balance_data', JSON.stringify(balanceData));
            updateBalanceUI();
        }
    });

    // Set Wish
    document.getElementById('set-wish-btn')?.addEventListener('click', () => {
        const val = prompt('璁剧疆蹇冩効鐡剁洰鏍囬噾棰?(楼):', balanceData.wish);
        if (val !== null && !isNaN(val) && Number(val) >= 0) {
            balanceData.wish = Number(val);
            localStorage.setItem('my_balance_data', JSON.stringify(balanceData));
            updateBalanceUI();
        }
    });

    // Add Expense
    document.getElementById('add-expense-btn')?.addEventListener('click', () => {
        const amt = document.getElementById('expense-amount').value;
        const cat = document.getElementById('expense-category').value;
        const note = document.getElementById('expense-note').value;
        if (!amt || isNaN(amt) || Number(amt) <= 0) return alert('璇疯緭鍏ユ湁鏁堥噾棰?);
        
        balanceData.balance -= Number(amt);
        balanceData.records.push({
            id: Date.now(), type: 'expense', amount: Number(amt), category: cat, note: note, time: Date.now()
        });
        localStorage.setItem('my_balance_data', JSON.stringify(balanceData));
        updateBalanceUI();
        document.getElementById('expense-amount').value = '';
        document.getElementById('expense-note').value = '';
        alert('璁拌处鎴愬姛锛?);
    });

    // Add Resist
    document.getElementById('add-resist-btn')?.addEventListener('click', () => {
        const amt = document.getElementById('expense-amount').value;
        const cat = document.getElementById('expense-category').value;
        const note = document.getElementById('expense-note').value;
        if (!amt || isNaN(amt) || Number(amt) <= 0) return alert('璇疯緭鍏ユ湁鏁堥噾棰?);
        
        balanceData.balance += Number(amt);
        balanceData.records.push({
            id: Date.now(), type: 'resist', amount: Number(amt), category: cat, note: note, time: Date.now()
        });
        localStorage.setItem('my_balance_data', JSON.stringify(balanceData));
        updateBalanceUI();
        document.getElementById('expense-amount').value = '';
        document.getElementById('expense-note').value = '';
        alert('鎴愬姛蹇嶄綇娑堣垂锛佺瓑鍚岃祫閲戝凡瀛樺叆閲戝簱锛?);
    });

    // === 瀵规柟鐘舵€佹煡鐪嬮€昏緫 ===
    const convSimpleStatusArea = document.getElementById('conv-simple-status-area');
    const contactStatusModal = document.getElementById('contact-status-modal');
    const contactStatusText = document.getElementById('contact-status-text');
    const setSameStatusBtn = document.getElementById('set-same-status-btn');
    const csAvatar = document.getElementById('cs-avatar');
    const csName = document.getElementById('cs-name');

    if (convSimpleStatusArea) {
        convSimpleStatusArea.addEventListener('click', () => {
            if (!currentActiveContactId) return;
            const contact = contacts.find(c => c.id === currentActiveContactId);
            const profile = roleProfiles[currentActiveContactId] || {};
            
            if (csAvatar) csAvatar.style.backgroundImage = `url('${contact.avatar || ''}')`;
            if (csName) csName.innerText = contact.name || '鏈懡鍚?;
            
            const currentStatus = profile.lastState || '鍦ㄧ嚎 - WiFi';
            if (contactStatusText) contactStatusText.innerHTML = `<span class="status-dot"></span> ${currentStatus}`;
            
            if (contactStatusModal) {
                contactStatusModal.classList.add('active');
            }
        });
    }
    
    if (setSameStatusBtn) {
        setSameStatusBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!currentActiveContactId) return;
            const profile = roleProfiles[currentActiveContactId] || {};
            const currentStatus = profile.lastState || '鍦ㄧ嚎 - WiFi';
            
            const data = JSON.parse(localStorage.getItem('mine_profile_data') || '{}');
            data.status = currentStatus;
            localStorage.setItem('mine_profile_data', JSON.stringify(data));
            
            if (mineCurrentStatusText) mineCurrentStatusText.innerText = currentStatus;
            
            alert('宸茶涓虹浉鍚岀姸鎬侊紒');
            if (contactStatusModal) contactStatusModal.classList.remove('active');
        });
    }

    const csCloseBar = document.querySelector('.cs-close-bar');
    if (csCloseBar) {
        csCloseBar.addEventListener('click', () => {
            if (contactStatusModal) contactStatusModal.classList.remove('active');
        });
    }
    
    // 鐐瑰嚮鑳屾櫙鍏抽棴寮圭獥
    const closeContactStatusBg = document.getElementById('close-contact-status');
    if (closeContactStatusBg) {
        closeContactStatusBg.addEventListener('click', () => {
            if (contactStatusModal) contactStatusModal.classList.remove('active');
        });
    }
    
    if (contactStatusModal) {
        contactStatusModal.addEventListener('click', (e) => {
            if (e.target === contactStatusModal) contactStatusModal.classList.remove('active');
        });
    }

    // 鏆撮湶鏍稿績鎺ュ彛渚涘叾浠栨枃浠惰皟鐢?
    window.ChatApp = {
        get currentActiveContactId() { return currentActiveContactId; },
        contacts: contacts,
        chatList: chatList,
        messagesData: messagesData,
        stickerGroups: stickerGroups,
        roleProfiles: roleProfiles,
        sendMsg: sendMsg,
        renderMessages: renderMessages,
        hideAllDrawers: hideAllDrawers,
        applyChatBackground: applyChatBackground,
        applyCustomCss: applyCustomCss
    };

    // --- NEW UI IMAGE UPLOADS ---
    const newImageTargets = [
        { id: 'upload-capsule-bg', target: 'capsule-widget-bg', isBg: true },
        { id: 'upload-capsule-avatar', target: 'image-target-capsule-avatar', isBg: true },
        { id: 'upload-small-rounded', target: 'image-target-small-rounded', isBg: true },
        { id: 'upload-polaroid-1', target: 'image-target-polaroid-1', isBg: true },
        { id: 'upload-original-square', target: 'image-target-original-square', isBg: true },
        { id: 'upload-polaroid-row-1', target: 'image-target-polaroid-row-1', isBg: true },
        { id: 'upload-polaroid-row-2', target: 'image-target-polaroid-row-2', isBg: true },
        { id: 'upload-polaroid-row-3', target: 'image-target-polaroid-row-3', isBg: true },
        { id: 'upload-large-rounded', target: 'image-target-large-rounded', isBg: true }
    ];

    function applyCustomImg(inputId, targetSelector, base64, isBg) {
        let el = document.getElementById(targetSelector) || document.querySelector('#' + targetSelector);
        if(el) {
            if(isBg) {
                el.style.backgroundImage = `url('${base64}')`;
                const icon = el.querySelector('.empty-icon');
                if(icon) icon.style.display = 'none';
                el.classList.add('has-image');
            } else {
                el.src = base64;
                el.classList.add('has-image');
            }
        }
    }

    newImageTargets.forEach(item => {
        const input = document.getElementById(item.id);
        if(input) {
            input.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if(file) {
                    compressImage(file, 800, 800, 0.8, (dataUrl) => {
                        if(dataUrl) {
                            safeSetItem('custom_img_' + item.id, dataUrl);
                            applyCustomImg(item.id, item.target, dataUrl, item.isBg);
                        }
                    });
                }
                e.target.value = '';
            });
        }
    });

    // Load saved new UI images
    newImageTargets.forEach(item => {
        const saved = localStorage.getItem('custom_img_' + item.id);
        if(saved) {
            applyCustomImg(item.id, item.target, saved, item.isBg);
        }
    });

});







