with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\Board.tsx', 'rb') as f:
    data = f.read()

idx = data.find(b'}\r\n\r\nfunction Poster')
print("Found at:", idx)

# Get context around it
print(repr(data[idx-10:idx+50]))