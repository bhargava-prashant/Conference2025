export const config = {
  runtime: "edge"
};

export async function onRequestPost({ request, env }) {
  try {
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return json({ success: false, message: "Expected multipart/form-data" }, 400);
    }

    const formData = await request.formData();
    const authorsRaw = formData.get("authors");
    const abstract = formData.get("abstract");
    const paper = formData.get("paper");

    if (!authorsRaw || !abstract || !paper) {
      return json({ success: false, message: "Missing required fields" }, 400);
    }

    let authors = [];
    try { authors = JSON.parse(authorsRaw); } catch { authors = []; }
    if (!Array.isArray(authors) || authors.length === 0) {
      return json({ success: false, message: "Invalid authors" }, 400);
    }

    // Note: On Pages Functions we can't persist files directly. Store metadata only.
    const document = {
      authors,
      abstract,
      paperName: paper.name || "paper.pdf",
      paperType: paper.type || "application/pdf",
      paperSize: paper.size || 0,
      createdAt: new Date().toISOString()
    };

    const insertResult = await insertOne(env, env.MONGODB_COLLECTION_PAPERS || "papers", document);
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


