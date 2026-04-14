// Copyright (c) 2026 World Class Scholars, led by Dr Christopher Appiah-Thompson. All rights reserved.
import sql from "@/app/api/utils/sql";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const residentId = searchParams.get("residentId");

    let query = `SELECT * FROM messages WHERE 1=1`;
    const params = [];

    if (residentId) {
      query += ` AND resident_id = $${params.length + 1}`;
      params.push(residentId);
    }

    query += ` ORDER BY created_at DESC LIMIT 100`;

    const messages = await sql(query, params);
    return Response.json(messages);
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Failed to fetch messages" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const { sender_name, sender_role, content, resident_id } =
      await request.json();
    const [message] = await sql`
      INSERT INTO messages (sender_name, sender_role, content, resident_id)
      VALUES (${sender_name}, ${sender_role}, ${content}, ${resident_id})
      RETURNING *
    `;
    return Response.json(message);
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Failed to create message" },
      { status: 500 },
    );
  }
}
