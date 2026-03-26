import re

with open('style.css', 'r', encoding='utf-8') as f:
    css = f.read()

css = css.replace('.hidden-file-input { display: none; }', '.hidden-file-input { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; overflow: hidden; }')

with open('style.css', 'w', encoding='utf-8') as f:
    f.write(css)

with open('APP.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Fix applyCustomIcon undefined error
js = js.replace('if(savedIcon)applyCustomIcon(item.id,savedIcon);', "if(savedIcon){ item.style.backgroundImage = `url('${savedIcon}')`; item.classList.add('has-custom-icon'); }")

# Safely wrap addEventListeners for missing elements
targeted_vars = [
    'lineProfileBg', 'uploadLineBg', 'uploadLineAvatar', 'uploadLineFrame', 
    'clearLineFrameBtn', 'lineNickname', 'lineStatus', 'btnDecorate', 
    'closeFrameModalBtn', 'btnEnterMoments', 'postMomentBtn', 'submitMomentBtn',
    'cancelPostBtn', 'closeMfBtn', 'igEditProfileBtn', 'uploadIgAvatar', 'saveIgProfileBtn',
    'starSystemAppBtn', 'closeSsBtn', 'ssBtnCheckin', 'ssBtnJourney', 'ssBtnBottle', 'ssBtnGallery',
    'closeJourneyBtn', 'startJourneyBtn', 'closeGalleryBtn', 'closeBottleBtn',
    'kaSettingsNav', 'closeKaBtn', 'reqNotifyBtn', 'testNotifyBtn', 'startKeepAliveBtn',
    'naiSettingsNav', 'closeNaiBtn', 'saveNaiBtn', 'modeSelect', 'presetSelect', 'savePresetBtn', 'delPresetBtn',
    'bindAiBtn', 'closeAiSettingsBtn', 'saveAiSettingsBtn', 'forceAiPostBtn',
    'uploadMomentImage', 'postAuthorSelect'
]

for var in targeted_vars:
    js = re.sub(r'^(\s*)(' + var + r')\.addEventListener\(', r'\1if (\2) \2.addEventListener(', js, flags=re.MULTILINE)

# Wrap loadLineProfile
js = js.replace('loadLineProfile();', 'try { loadLineProfile(); } catch(e) { console.warn("loadLineProfile skipped:", e); }')

with open('APP.js', 'w', encoding='utf-8') as f:
    f.write(js)

with open('features.js', 'r', encoding='utf-8') as f:
    feat = f.read()

feat = feat.replace('window.ChatApp.messagesData', '(window.ChatApp ? window.ChatApp.messagesData : "ChatApp未加载")')

with open('features.js', 'w', encoding='utf-8') as f:
    f.write(feat)

print("Fix applied.")
