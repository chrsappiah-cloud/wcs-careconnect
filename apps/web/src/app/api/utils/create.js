// Copyright (c) 2026 World Class Scholars, led by Dr Christopher Appiah-Thompson. All rights reserved.
const create = {
	db: (database) => ({
		from: (table) => {
			return {
				getById: async (id) => {
					const response = await fetch(`/api/db/${database}`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							query: `SELECT * FROM \`${table}\` WHERE \`id\` = ? LIMIT 1`,
							values: [id],
						}),
					});
					const data = await response.json();
					if (data.length > 0) {
						return data[0];
					}
					return null;
				},
			};
		},
	}),
};

export default create;
