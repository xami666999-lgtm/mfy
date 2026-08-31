with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\PlayerPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove superembed option
old_select = '''<option value="vidy">Vidy</option>
              <option value="vidking">VidKing</option>
              <option value="superembed">SuperEmbed</option>
            </select>'''

new_select = '''<option value="vidy">Vidy</option>
              <option value="vidking">VidKing</option>
            </select>'''

content = content.replace(old_select, new_select)

with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\PlayerPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')