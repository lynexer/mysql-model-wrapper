import {
    FieldPacket,
    Pool,
    PoolOptions,
    RowDataPacket,
    createPool
} from 'mysql2/promise';
import { MySqlGrammar } from './Query/MySqlGrammar';

export class Connection {
    private credentials: PoolOptions;
    private conn: Pool;
    protected queryGrammar: MySqlGrammar;

    constructor(credentials: PoolOptions) {
        this.credentials = credentials;
        this.conn = createPool(this.credentials);

        this.queryGrammar = new MySqlGrammar();
    }

    private ensureConnection() {
        if (!this?.conn) {
            this.conn = createPool(this.credentials);
        }
    }

    public getQueryGrammar(): MySqlGrammar {
        return this.queryGrammar;
    }

    public setQueryGrammer(grammar: MySqlGrammar): this {
        this.queryGrammar = grammar;

        return this;
    }

    public async query(sql: string): Promise<[RowDataPacket[], FieldPacket[]]> {
        this.ensureConnection();
        return await this.conn.query<RowDataPacket[]>(sql);
    }
}
