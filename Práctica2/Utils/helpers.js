function error(res, status, message) {
    return res.status(status).json({ error: message });
}

module.exports = { error };