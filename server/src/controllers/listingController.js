import Joi from 'joi';
import { Listing } from '../models/Listing.js';

// Validation schema for create/update
const listingValidationSchema = Joi.object({
  title: Joi.string().trim(),
  description: Joi.string().allow('', null).trim(),
  price: Joi.number().min(0),
  category: Joi.string().valid('textbooks', 'electronics', 'furniture', 'clothing', 'other'),
  condition: Joi.string().valid('new', 'like-new', 'used', 'worn'),
  status: Joi.string().valid('active', 'sold', 'removed'),
  seller: Joi.string().hex().length(24).allow(null)
});

// GET /api/listings
export async function getAllListings(req, res, next) {
  try {
    const filter = {};
    if (req.query.includeRemoved !== 'true') {
      filter.status = { $ne: 'removed' };
    }

    const listings = await Listing.find(filter).populate('seller', 'name email');
    res.status(200).json(listings);
  } catch (err) { 
    next(err); 
  }
}

// GET /api/listings/:id
// GET /api/listings/:id
// GET /api/listings/:id
export async function getListing(req, res, next) {
  try {
    const listing = await Listing.findById(req.params.id).populate('seller', 'name email');
    
    // Only return 404 if the document doesn't exist in the database at all
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found.' });
    }

    // Return the listing unconditionally so the client can see its 'removed' status
    res.status(200).json(listing);
  } catch (err) { 
    next(err); 
  }
}

// POST /api/listings
export async function createListing(req, res, next) {
  try {
    const schema = listingValidationSchema.keys({
      title: Joi.string().required(),
      price: Joi.number().min(0).required()
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const newListing = await Listing.create(value);
    res.status(201).json(newListing);
  } catch (err) { 
    next(err); 
  }
}

// PATCH /api/listings/:id
// PATCH /api/listings/:id
export async function updateListing(req, res, next) {
  try {
    const { error, value } = listingValidationSchema.min(1).validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // 1. Fetch the existing listing first to check its current status
    const existingListing = await Listing.findById(req.params.id);
    
    if (!existingListing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    // 2. Prevent changing the price or category if the item is already sold
    if (existingListing.status === 'sold') {
      if (value.price !== undefined || value.category !== undefined) {
        return res.status(400).json({ 
          error: 'Cannot update price or category after a listing is sold.' 
        });
      }
    }

    // 3. If it passes the check, apply the updates
    const updatedListing = await Listing.findByIdAndUpdate(
      req.params.id,
      value,
      { new: true, runValidators: true }
    );

    res.status(200).json(updatedListing);
  } catch (err) { 
    next(err); 
  }
}


// DELETE /api/listings/:id (Soft delete)
export async function deleteListing(req, res, next) {
  try {
    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      { status: 'removed' },
      { new: true }
    );

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    res.status(200).json({ message: 'Listing removed successfully', listing });
  } catch (err) { 
    next(err); 
  }
}