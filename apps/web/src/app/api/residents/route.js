// Copyright (c) 2026 World Class Scholars, led by Dr Christopher Appiah-Thompson. All rights reserved.
import sql from "@/app/api/utils/sql";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const wardId = searchParams.get("wardId");
    const facilityId = searchParams.get("facilityId");

    let query = `
      SELECT r.*, 
        (SELECT json_agg(rd) FROM (SELECT * FROM readings WHERE resident_id = r.id ORDER BY recorded_at DESC LIMIT 1) rd) as latest_readings,
        (SELECT count(*) FROM alerts WHERE resident_id = r.id AND status = 'open') as open_alerts_count
      FROM residents r
      WHERE 1=1
    `;
    const params = [];

    if (wardId) {
      query += ` AND r.ward_id = $${params.length + 1}`;
      params.push(wardId);
    }
    if (facilityId) {
      query += ` AND r.facility_id = $${params.length + 1}`;
      params.push(facilityId);
    }

    query += ` ORDER BY r.status = 'critical' DESC, r.status = 'warning' DESC, r.name ASC`;

    const residents = await sql(query, params);
    return Response.json(residents);
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Failed to fetch residents" },
      { status: 500 },
    );
  }
}
