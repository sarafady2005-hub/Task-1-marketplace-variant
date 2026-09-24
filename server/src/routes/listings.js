import { Router } from 'express';
import {
  getAllListings,
  getListing,
  createListing,
  updateListing,
  deleteListing
} from '../controllers/listingController.js';

const router = Router();

// TODO: wire up the routes described in README.md section 3.

router.route('/')
  .get(getAllListings)
  .post(createListing);

router.route('/:id')
  .get(getListing)
  .patch(updateListing)
  .delete(deleteListing);

export default router;