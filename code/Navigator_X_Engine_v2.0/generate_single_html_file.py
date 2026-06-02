import re
import chardet
import rjsmin


# Function to detect encoding and read file content
def read_file_with_detected_encoding(filepath):
    with open(filepath, "rb") as f:
        raw_data = f.read()
        # Detect the encoding of the file using chardet
        result = chardet.detect(raw_data)
        encoding = result["encoding"]
        print(f"Detected encoding for {filepath}: {encoding}")
        # Decode using the detected encoding and ignore errors
        return raw_data.decode(encoding, errors="ignore")


# Read the content of each file using the detected encoding
app_js_content = read_file_with_detected_encoding("app.js")
index_html_content = read_file_with_detected_encoding("index.html")
styles_css_content = read_file_with_detected_encoding("styles.css")

# Minify the JavaScript code using rjsmin
minified_app_js_content = rjsmin.jsmin(app_js_content)

# Remove references to external files in the HTML content
updated_html_content = index_html_content.replace(
    '<link rel="stylesheet" type="text/css" href="styles.css">', ""
).replace("<script src='./app.js'></script>", "")

# Find the position to insert the style and script tags
head_end_index = updated_html_content.find("</head>")
body_end_index = updated_html_content.find("</body>")

# Insert the style and script tags in the correct positions
combined_html_content = (
    updated_html_content[:head_end_index]
    + f"<style>{styles_css_content}</style>"
    + updated_html_content[head_end_index:body_end_index]
    + f"<script>{minified_app_js_content}</script>"
    + updated_html_content[body_end_index:]
)
# Remove multiple consecutive newlines using regex
combined_html_content = re.sub(r"\n\s*\n+", "\n", combined_html_content)

# Optionally, remove leading and trailing whitespace from each line
combined_html_content = "\n".join(
    line.rstrip() for line in combined_html_content.splitlines()
)


with open(
    "squarespace_files/waikato_regional_council_navx_styled.html",
    "w",
    encoding="utf-8",
    errors="ignore",
) as f:
    f.write(combined_html_content)

print("Combined HTML file created successfully.")
