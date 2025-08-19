// ===== 時間戳管理器 =====
class TimestampManager {
    // 建立新的時間戳
    static createTimestamp() {
        return new Date().toISOString();
    }
    
    // 更新項目的時間戳（角色、世界書、筆記）
    static updateItemTimestamp(type, itemId) {
        const items = DataOperations.getItems(type);
        const item = items.find(i => i.id === itemId);
        if (item) {
            item.updatedAt = this.createTimestamp();
        }
    }
    
    // 更新版本的時間戳
    static updateVersionTimestamp(type, itemId, versionId) {
        const items = DataOperations.getItems(type);
        const item = items.find(i => i.id === itemId);
        if (item) {
            const version = item.versions.find(v => v.id === versionId);
            if (version) {
                version.updatedAt = this.createTimestamp();
                // 同時更新父項目的時間戳
                item.updatedAt = version.updatedAt;
            }
        }
    }
    
    // 格式化時間顯示
    static formatTimestamp(timestamp) {
        if (!timestamp) return '';
        
        const date = new Date(timestamp);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        
        const timeString = date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
        
        if (targetDate.getTime() === today.getTime()) {
            return `Today, ${timeString}`;
        } else if (targetDate.getTime() === yesterday.getTime()) {
            return `Yesterday, ${timeString}`;
        } else {
            const dateString = date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
            return `${dateString}, ${timeString}`;
        }
    }
    
    // 遷移舊資料：為沒有時間戳的資料補充時間戳
    static migrateOldData() {
        const now = this.createTimestamp();
        let migrationCount = 0;
        
        // 遷移角色資料
        characters.forEach(character => {
            if (!character.createdAt) {
                character.createdAt = now;
                character.updatedAt = now;
                migrationCount++;
            }
            
            character.versions.forEach(version => {
                if (!version.createdAt) {
                    version.createdAt = now;
                    version.updatedAt = now;
                    migrationCount++;
                }
            });
        });
        
        // 遷移自定義區塊資料
        customSections.forEach(section => {
            if (!section.createdAt) {
                section.createdAt = now;
                section.updatedAt = now;
                migrationCount++;
            }
            
            section.versions.forEach(version => {
                if (!version.createdAt) {
                    version.createdAt = now;
                    version.updatedAt = now;
                    migrationCount++;
                }
            });
        });
        
        // 遷移世界書資料
        worldBooks.forEach(worldBook => {
            if (!worldBook.createdAt) {
                worldBook.createdAt = now;
                worldBook.updatedAt = now;
                migrationCount++;
            }
            
            worldBook.versions.forEach(version => {
                if (!version.createdAt) {
                    version.createdAt = now;
                    version.updatedAt = now;
                    migrationCount++;
                }
            });
        });
        
        if (migrationCount > 0) {
            saveData(); // 儲存遷移後的資料
        }
        
        return migrationCount;
    }
}