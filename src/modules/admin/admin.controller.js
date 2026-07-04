const { getSummary, getRatings } = require('./admin.service');

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

module.exports = { dashboard, ratings };
