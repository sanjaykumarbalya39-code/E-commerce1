# Task 14: Image Upload System

## 1. What is `multipart/form-data`?

`multipart/form-data` is an HTTP request format designed to send files and form
fields together. Each part of the request has its own headers and content, so
the image is sent as its original binary file data rather than being converted
into a text value.

A normal JSON request sends structured text, for example:

```json
{
	"name": "Brass Table Lamp",
	"image_url": "/static/uploads/lamp.jpg"
}
```

JSON cannot directly carry a browser `File` object. The frontend therefore uses
`FormData` and sends the file as multipart data:

```jsx
const formData = new FormData();
formData.append("image", file);

const uploadRes = await api.post("/upload", formData, {
	headers: { "Content-Type": "multipart/form-data" },
});
```

The upload happens first. The backend returns the saved image path, and that
path is then included in the normal JSON request that creates or updates the
product.

## 2. Unique filenames

Every upload gets a UUID-based filename:

```python
import uuid

ext = filename.rsplit(".", 1)[-1].lower()
unique_name = f"{uuid.uuid4().hex}.{ext}"
```

UUIDs prevent two files with the same original name, such as `photo.jpg`, from
overwriting one another. Without a unique filename, a later upload with the
same name could silently replace the earlier product image.

## 3. File validation

The backend allows only the required image extensions:

```python
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}


def allowed_file(filename):
		if not filename:
				return False
		ext = filename.rsplit(".", 1)[-1].lower()
		return "." in filename and ext in ALLOWED_EXTENSIONS
```

The upload route rejects missing files, empty selections, and unsupported file
types:

```python
if "image" not in request.files:
		return jsonify({"error": "No file provided"}), 400

file = request.files["image"]
if file.filename == "":
		return jsonify({"error": "No file selected"}), 400
if not allowed_file(file.filename):
		return jsonify({"error": "Invalid file type"}), 400
```

The maximum request size is limited to 2 MB in Flask:

```python
app.config["MAX_CONTENT_LENGTH"] = 2 * 1024 * 1024
```

This blocks oversized uploads at the request level before the file is saved.

## 4. Storage and displaying the image

Flask creates and uses the `backend/static/uploads` directory:

```python
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "static", "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
```

The complete save operation is:

```python
filename = secure_filename(file.filename)
ext = filename.rsplit(".", 1)[-1].lower()
unique_name = f"{uuid.uuid4().hex}.{ext}"
filepath = os.path.join(app.config["UPLOAD_FOLDER"], unique_name)
file.save(filepath)

image_url = f"/static/uploads/{unique_name}"
return jsonify({"image_url": image_url}), 201
```

Because the directory is inside Flask's `static` folder, a saved file is served
at this URL pattern:

```text
http://localhost:5000/static/uploads/<unique-filename>
```

The frontend stores the returned path in the product record and adds the Flask
base URL when displaying it:

```jsx
const BACKEND_BASE_URL = "http://localhost:5000";

function resolveImageUrl(src) {
	if (!src) return "";
	if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("data:")) {
		return src;
	}
	return `${BACKEND_BASE_URL}${src}`;
}
```

For example, the stored path `/static/uploads/abc123.jpg` becomes:

```text
http://localhost:5000/static/uploads/abc123.jpg
```

Uploaded files are excluded from Git with the following rule, while `.gitkeep`
preserves the directory:

```gitignore
backend/static/uploads/*
!backend/static/uploads/.gitkeep
```
