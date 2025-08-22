export const isImageFile = (filename: string): boolean => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    return imageExtensions.includes(ext);
};

export const isTextFile = (filename: string): boolean => {
    const textExtensions = [
        '.txt', '.md', '.log', '.json', '.xml', '.csv', '.yaml', '.yml',
        '.js', '.ts', '.jsx', '.tsx', '.html', '.css', '.scss', '.sass',
        '.py', '.java', '.c', '.cpp', '.h', '.hpp', '.php', '.rb', '.go',
        '.rs', '.sh', '.bat', '.ps1', '.sql', '.ini', '.conf', '.cfg',
        '.properties', '.toml', '.gitignore', '.env', '.dockerfile'
    ];
    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    return textExtensions.includes(ext);
};

export const getFileIcon = (filename: string): string => {
    if (isImageFile(filename)) {
        return '🖼️';
    }
    if (isTextFile(filename)) {
        return '📝';
    }
    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    switch (ext) {
        case '.pdf':
            return '📄';
        case '.zip':
        case '.rar':
            return '📦';
        case '.doc':
        case '.docx':
            return '📝';
        case '.txt':
            return '📃';
        default:
            return '📎';
    }
};

export const validateFiles = (files: File[]): { valid: File[], invalid: File[] } => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'text/plain', 'application/pdf', 'application/zip',
        'application/x-zip-compressed', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    const valid: File[] = [];
    const invalid: File[] = [];

    files.forEach(file => {
        if (file.size <= maxSize && allowedTypes.includes(file.type)) {
            valid.push(file);
        } else {
            invalid.push(file);
        }
    });

    return {valid, invalid};
};

export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
