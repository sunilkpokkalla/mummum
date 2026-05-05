#!/bin/bash
# Fix SwiftUICore.tbd to remove the allowable-clients restriction
# This is the root cause of "cannot link directly with SwiftUICore" on Apple Silicon simulators

TBD_PATH="/Applications/Xcode.app/Contents/Developer/Platforms/iPhoneSimulator.platform/Developer/SDKs/iPhoneSimulator.sdk/System/Library/Frameworks/SwiftUICore.framework/SwiftUICore.tbd"

echo "Patching SwiftUICore.tbd..."

# Backup the original
sudo cp "$TBD_PATH" "${TBD_PATH}.bak"

# Remove the allowable-clients section (lines between allowable-clients: and reexported-libraries:)
sudo python3 -c "
import re
with open('$TBD_PATH', 'r') as f:
    content = f.read()
# Remove the allowable-clients block
patched = re.sub(r'allowable-clients:.*?(?=reexported-libraries:)', '', content, flags=re.DOTALL)
with open('$TBD_PATH', 'w') as f:
    f.write(patched)
print('Done')
"

echo "✅ SwiftUICore.tbd patched successfully!"
echo "   Original backed up to: ${TBD_PATH}.bak"
echo ""
echo "Now run: npx expo run:ios"
