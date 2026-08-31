with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\Board.tsx', 'rb') as f:
    data = f.read()
# Find "}\r\n\r\nfunction Poster"
idx = data.find(b'}\r\n\r\nfunction Poster')
print("Found at:", idx)
print(repr(data[idx:idx+50]))