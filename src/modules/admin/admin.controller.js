const { getSummary } = require('./admin.service');

function dashboard(req, res) {
  const summary = getSummary();
  return res.render('admin/dashboard', {
    pageTitle: 'Panel administrativo',
    summary
  });
}

module.exports = { dashboard };