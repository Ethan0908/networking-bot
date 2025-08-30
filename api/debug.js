export default async function handler(req, res) {
  res.status(200).json({
    has_ADD_URL: !!process.env.N8N_ADD_URL,
    has_LIST_URL: !!process.env.N8N_LIST_URL,
    auth_header_set: !!process.env.N8N_AUTH_HEADER
  });
}