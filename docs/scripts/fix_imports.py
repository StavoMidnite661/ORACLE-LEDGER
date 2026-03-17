import os
import re

def fix_imports(directory):
    # Regex to find relative imports that don't have an extension
    # It looks for lines starting with import/export and having from './...' or '../...'
    import_re = re.compile(r'((import|export)\s+.+?\s+from\s+[\'"](\.?\.\/.*?))(?<!\.[a-z0-9]+)([\'"];?)')

    for root, dirs, files in os.walk(directory):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        if '.git' in dirs:
            dirs.remove('.git')
        if '.next' in dirs:
            dirs.remove('.next')
        if 'dist' in dirs:
            dirs.remove('dist')

        for file in files:
            if file.endswith(('.ts', '.tsx')):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()

                new_content = import_re.sub(r'\1.js\4', content)

                if content != new_content:
                    print(f"Updating imports in: {path}")
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(new_content)

if __name__ == "__main__":
    project_dir = os.getcwd()
    print(f"Starting import fix in: {project_dir}")
    fix_imports(project_dir)
    print("Import fix complete.")
