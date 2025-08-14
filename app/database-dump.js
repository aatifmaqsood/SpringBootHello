const fs = require('fs');
const path = require('path');

// Database dump utility
class DatabaseDump {
    constructor(config) {
        this.config = config;
        this.dumpDir = path.join(__dirname, 'dumps');
        this.ensureDumpDirectory();
    }

    ensureDumpDirectory() {
        if (!fs.existsSync(this.dumpDir)) {
            fs.mkdirSync(this.dumpDir, { recursive: true });
        }
    }

    // Create a dump of sample data (replace with your actual database connection)
    async createDump() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const dumpFile = path.join(this.dumpDir, `dump-${timestamp}.json`);
        
        // Sample data structure - replace with your actual data
        const sampleData = {
            users: [
                { id: 1, name: 'John Doe', email: 'john@example.com', role: 'admin' },
                { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'user' },
                { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'user' }
            ],
            products: [
                { id: 1, name: 'Product A', price: 29.99, category: 'electronics' },
                { id: 2, name: 'Product B', price: 49.99, category: 'clothing' },
                { id: 3, name: 'Product C', price: 19.99, category: 'books' }
            ],
            orders: [
                { id: 1, userId: 1, productId: 1, quantity: 2, total: 59.98, date: '2024-01-15' },
                { id: 2, userId: 2, productId: 2, quantity: 1, total: 49.99, date: '2024-01-16' },
                { id: 3, userId: 3, productId: 3, quantity: 3, total: 59.97, date: '2024-01-17' }
            ]
        };

        try {
            fs.writeFileSync(dumpFile, JSON.stringify(sampleData, null, 2));
            console.log(`Database dump created successfully: ${dumpFile}`);
            return dumpFile;
        } catch (error) {
            console.error('Error creating dump:', error);
            throw error;
        }
    }

    // Load a dump file
    loadDump(dumpFile) {
        try {
            const data = fs.readFileSync(dumpFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error loading dump:', error);
            throw error;
        }
    }

    // List all available dumps
    listDumps() {
        try {
            const files = fs.readdirSync(this.dumpDir);
            return files.filter(file => file.endsWith('.json'));
        } catch (error) {
            console.error('Error listing dumps:', error);
            return [];
        }
    }
}

// Example usage
if (require.main === module) {
    const dbDump = new DatabaseDump();
    
    // Create a new dump
    dbDump.createDump().then(dumpFile => {
        console.log('Dump file created:', dumpFile);
        
        // List all dumps
        const dumps = dbDump.listDumps();
        console.log('Available dumps:', dumps);
        
        // Load the latest dump
        const data = dbDump.loadDump(dumpFile);
        console.log('Loaded data:', JSON.stringify(data, null, 2));
    }).catch(console.error);
}

module.exports = DatabaseDump;
