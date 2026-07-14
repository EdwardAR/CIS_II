const { getSummary, getRatings, getAuditLogs } = require('./admin.service');

function dashboard(req, res) {
  const summary = getSummary();
  return res.render('admin/dashboard', {
    pageTitle: 'Panel administrativo',
    summary
  });
}

function ratings(req, res) {
  const data = getRatings();
  return res.render('admin/ratings', {
    pageTitle: 'Calificaciones',
    allRatings: data.allRatings,
    byDoctor:   data.byDoctor
  });
}

function auditLogs(req, res) {
  var data = getAuditLogs(req.query);
  return res.render('admin/audit', {
    pageTitle: 'Auditoria del sistema',
    logs: data.rows,
    total: data.total,
    page: data.page,
    totalPages: data.totalPages,
    limit: data.limit,
    filterAction: data.action,
    filterTarget: data.target,
    filterUser: data.user
  });
}

module.exports = { dashboard, ratings, auditLogs };
