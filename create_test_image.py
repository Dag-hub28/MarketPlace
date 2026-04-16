from PIL import Image

# Create a simple test image (100x100 red square)
img = Image.new("RGB", (800, 600), color="red")
img.save("test_image.jpg")
print("Test image created: test_image.jpg")
