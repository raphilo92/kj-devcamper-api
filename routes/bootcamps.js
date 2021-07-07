const express = require('express')
const {
  getBootcamps,
  createBootcamp,
  updateBootcamp,
  deleteBootcamp,
  getBootcamp,
  getBootcampsInRadius,
  bootcampPhotoUpload,
} = require('../controllers/bootcamps')

const advancedResults = require('../middleware/advancedResults')
const Bootcamp = require('../models/Bootcamp')

// Include other resource routers
const router = express.Router()
router
  .route('/')
  .get(advancedResults(Bootcamp, 'courses'), getBootcamps)
  .post(createBootcamp)
router.route('/:id').get(getBootcamp).put(updateBootcamp).delete(deleteBootcamp)
router.route('/radius/:zipcode/:distance').get(getBootcampsInRadius)
router.route('/:id/photo').put(bootcampPhotoUpload)

// Re-route into other resource routers
const courseRouter = require('./courses')
router.use('/:bootcampId/courses', courseRouter)
module.exports = router
