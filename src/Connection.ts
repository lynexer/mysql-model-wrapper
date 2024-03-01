import {
    FieldPacket,
    Pool,
    PoolOptions,
    RowDataPacket,
    createPool
} from 'mysql2/promise';

export class Connection {
    private credentials: PoolOptions;
    private conn: Pool;

    constructor(credentials: PoolOptions) {
        this.credentials = credentials;
        this.conn = createPool(this.credentials);
    }

    private ensureConnection() {
        if (!this?.conn) {
            this.conn = createPool(this.credentials);
        }
    }

    public async query(sql: string): Promise<[RowDataPacket[], FieldPacket[]]> {
        this.ensureConnection();
        return await this.conn.query<RowDataPacket[]>(sql);
    }
}
