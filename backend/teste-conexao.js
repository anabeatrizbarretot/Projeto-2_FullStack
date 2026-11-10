import pool from './src/config/database.js';

try {
    const resultado = await pool.query('SELECT NOW()');

    console.log('Conexão com PostgreSQL realizada com sucesso!');
    console.log('Data e hora do banco:', resultado.rows[0].now);
} catch (erro) {
    console.error('Erro ao conectar com PostgreSQL:', erro.message);
} finally {
    await pool.end();
}