import base64
import struct
import zlib

def create_simple_png(width, height, pixels):
    """Create a simple PNG from raw pixel data"""
    def png_chunk(chunk_type, data):
        chunk_len = struct.pack('>I', len(data))
        chunk_data = chunk_type + data
        chunk_crc = struct.pack('>I', zlib.crc32(chunk_data) & 0xffffffff)
        return chunk_len + chunk_data + chunk_crc
    
    # PNG signature
    png = b'\x89PNG\r\n\x1a\n'
    
    # IHDR chunk
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)  # 8-bit RGBA
    png += png_chunk(b'IHDR', ihdr_data)
    
    # IDAT chunk (compressed pixel data)
    raw_data = b''
    for y in range(height):
        raw_data += b'\x00'  # Filter type for each row
        for x in range(width):
            pixel = pixels.get((x, y), (255, 255, 255, 0))  # Default transparent
            raw_data += bytes(pixel)  # RGBA
    
    compressed = zlib.compress(raw_data, 9)
    png += png_chunk(b'IDAT', compressed)
    
    # IEND chunk
    png += png_chunk(b'IEND', b'')
    
    return png

def draw_circle(pixels, cx, cy, radius, color):
    """Draw a filled circle"""
    for x in range(int(cx - radius), int(cx + radius) + 1):
        for y in range(int(cy - radius), int(cy + radius) + 1):
            dx = x - cx
            dy = y - cy
            if dx*dx + dy*dy <= radius*radius:
                pixels[(x, y)] = color

def create_tomato_icon(size):
    """Create a tomato timer icon"""
    pixels = {}
    center = size / 2
    radius = size * 0.38
    
    # Draw tomato (red-orange circle)
    draw_circle(pixels, center, center, radius, (255, 107, 90, 255))
    
    # Draw highlight
    hl_center_x = center - radius * 0.3
    hl_center_y = center - radius * 0.3
    hl_radius = radius * 0.3
    for x in range(int(hl_center_x - hl_radius), int(hl_center_x + hl_radius) + 1):
        for y in range(int(hl_center_y - hl_radius), int(hl_center_y + hl_radius) + 1):
            dx = x - hl_center_x
            dy = y - hl_center_y
            if dx*dx + dy*dy <= hl_radius*hl_radius:
                pixels[(x, y)] = (255, 139, 122, 120)
    
    # Draw stem (green rectangle at top)
    stem_width = max(1, int(size / 10))
    stem_x = int(center - stem_width / 2)
    stem_y = int(center - radius - size * 0.1)
    for x in range(stem_x, stem_x + stem_width):
        for y in range(stem_y, int(center - radius + size * 0.02)):
            if 0 <= x < size and 0 <= y < size:
                pixels[(x, y)] = (82, 183, 136, 255)
    
    # Draw clock hands (white)
    hand_len_h = int(radius * 0.5)
    hand_len_m = int(radius * 0.65)
    
    # Hour hand (vertical)
    for i in range(hand_len_h):
        y = int(center - i)
        if 0 <= y < size:
            pixels[(int(center), y)] = (255, 255, 255, 255)
            if i > 0:
                pixels[(int(center) - 1, y)] = (255, 255, 255, 255)
    
    # Minute hand (horizontal)
    for i in range(hand_len_m):
        x = int(center + i)
        if 0 <= x < size:
            pixels[(x, int(center))] = (255, 255, 255, 255)
            if i > 0:
                pixels[(x, int(center) - 1)] = (255, 255, 255, 255)
    
    # Center dot (white)
    dot_r = max(1, int(size / 16))
    draw_circle(pixels, center, center, dot_r, (255, 255, 255, 255))
    
    return create_simple_png(size, size, pixels)

# Create and save icons
for size in [16, 32, 48, 128]:
    png_data = create_tomato_icon(size)
    filename = f'icons/icon-{size}.png'
    with open(filename, 'wb') as f:
        f.write(png_data)
    print(f'Created {filename}')
