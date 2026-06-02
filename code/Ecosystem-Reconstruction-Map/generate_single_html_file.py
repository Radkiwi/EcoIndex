# Read the content of each file
with open('app.js', 'r', encoding='utf-8') as f:
    app_js_content = f.read()

with open('index.html', 'r', encoding='utf-8') as f:
    index_html_content = f.read()

with open('styles.css', 'r', encoding='utf-8') as f:
    styles_css_content = f.read()

# Remove references to external files in the HTML content
updated_html_content = index_html_content.replace('<link rel="stylesheet" type="text/css" href="styles.css">', '') \
                                         .replace("<script src='./app.js'></script>", '')

# Find the position to insert the style and script tags
head_end_index = updated_html_content.find('</head>')
body_end_index = updated_html_content.find('</body>')

# Insert the style and script tags in the correct positions
combined_html_content = (updated_html_content[:head_end_index] +
                         f'<style>{styles_css_content}</style>' +
                         updated_html_content[head_end_index:body_end_index] +
                         f'<script>{app_js_content}</script>' +
                         updated_html_content[body_end_index:])

# Write the combined content to a new HTML file
with open('squarespace_files/combined.html', 'w', encoding='utf-8') as f:
    f.write(combined_html_content)

print('Combined HTML file created successfully.')
