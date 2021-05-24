import { createConnection } from 'typeorm';
import path from 'path';

export const connect = async () => {
	// await createConnection({
	// 	type: 'mysql',
	// 	host: 'localhost',
	// 	port: 3306,
	// 	database: 'datasaurus',
	// 	username: 'david',
	// 	password: 'David9812',
	// 	synchronize: true,
	// 	entities: [path.join(__dirname, '..', 'Entity', '**', '{*.ts, *.js}')]
	// });

	await createConnection({
		type: 'mysql',
		host: 'freedb.tech',
		port: 3306,
		database: 'freedbtech_davidarriaga',
		username: 'freedbtech_davidarriaga',
		password: 'David9812',
		synchronize: true,
		entities: [path.join(__dirname, '..', 'Entity', '**', '*.js')]
	});

	console.log('>> Database is connect');
};
