export async function onRequestPost({ request, env }) {
  try {
    const data = await request.json();

    const required = ["fullName", "email", "affiliation", "category", "phone", "address", "password"];
    for (const field of required) {
      if (!data[field] || String(data[field]).trim() === "") {
        return json({ success: false, message: `Missing required field: ${field}` }, 400);
      }
    }

    const document = {
      fullName: data.fullName,
      email: data.email,
      affiliation: data.affiliation,
      category: data.category,
      paperId: data.paperId || "",
      phone: data.phone,
      address: data.address,
      createdAt: new Date().toISOString()
    };

    const insertResult = await insertOne(env, env.MONGODB_COLLECTION_REGISTRATIONS || env.MONGODB_COLLECTION || "registrations", document);
    if (!insertResult.ok) {
      return json({ success: false, message: insertResult.message || "Database error" }, 500);
    }

    return json({ success: true, id: insertResult.insertedId });
  } catch (err) {
    return json({ success: false, message: err.message || "Unexpected error" }, 500);
  }
}

async function insertOne(env, collection, document) {
  const url = env.MONGODB_DATA_API_URL;
  const apiKey = env.MONGODB_DATA_API_KEY;
  const database = env.MONGODB_DATABASE;
  const dataSource = env.MONGODB_DATA_SOURCE || env.MONGODB_CLUSTER;

  if (!url || !apiKey || !database || !dataSource) {
    return { ok: false, message: "Missing MongoDB Data API configuration" };
  }

  const payload = {
    dataSource,
    database,
    collection,
    document
  };

  const res = await fetch(url.endsWith("/action/insertOne") ? url : url.replace(/\/$/, "") + "/action/insertOne", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const text = await safeText(res);
    return { ok: false, message: `MongoDB API error: ${res.status} ${text}` };
  }
  const json = await res.json();
  return { ok: true, insertedId: json.insertedId };
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

async function safeText(res) {
  try { return await res.text(); } catch { return ""; }
}


