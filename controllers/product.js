const Product = require("../models/product");
const formidable = require("formidable");
const _ = require("lodash");
const fs = require("fs");

//Create a product
exports.createProduct = (req, res) => {
	const form = formidable.IncomingForm();
	form.keepExtension = true;

	form.parse(req, (err, fields, file) => {
		if (err) {
			return res.status(400).json({
				error: "Bad request: Error occured while parsing file",
			});
		}

		//Destructuring fields
		const { name, description, price, category, stock } = fields;

		//Making sure that each field is being provided while requesting to add the product
		if (!name || !description || !price || !category || !stock) {
			return res.status(400).json({
				error: "Error: Please make sure no field is left empty",
			});
		}

		//Creating a product object
		let product = new Product(fields);

		//Handle files here
		if (file.photo) {
			//file size only upto 3MB is allowed
			if (file.photo.size > 3145728) {
				return res.status(400).json({
					error: "Bad request: File size bigger than 3MB is not allowed",
				});
			}

			//Providing file path and extension details in photo object
			product.photo.data = fs.readFileSync(file.photo.path);
			product.photo.contentType = file.photo.type;
		}

		//Save product to DB
		product.save((err, product) => {
			if (err) {
				return res.status(400).json({
					error: "Bad request: Error occured while saving product to DB",
				});
			}
			res.json(product);
		});
	});
};

//Middleware to get product by Id and save it to req.product object
exports.getProductById = (req, res, next, id) => {
	Product.findById(id)
		.populate("category")
		.exec((err, product) => {
			if (err) {
				return res.status(400).json({
					error: "Bad request: Error occured while finding product",
				});
			}
			if (!product) {
				return res.status(404).json({
					error: "Not found: product not found",
				});
			}
			req.product = product;
			next();
		});
};

//Send a product(found by getProductById) as a response
exports.getProduct = (req, res) => {
	req.product.photo = undefined;
	return res.json(req.product);
};

//Get all product
exports.getAllProduct = (req, res) => {
	//ternary operator used here to check for user input for "limit" which will be treated as string by default
	//Parsing the string value (limit) to integer number is done by parseInt(string)
	let limit = req.query.limit ? parseInt(req.query.limit) : 10000;
	let skip = req.query.skip ? parseInt(req.query.skip) : 0;

	//check for user input for "sortBy" & "ascDesc" which will be treated as string by default
	let sortBy = req.query.sortBy ? req.query.sortBy : "name";
	let ascDesc = req.query.ascDesc ? req.query.ascDesc : "asc";
	Product.find()
		.select("-photo")
		.populate("category")
		.sort([[sortBy, ascDesc]])
		.limit(limit)
		.skip(skip)
		.exec((err, allProducts) => {
			if (err) {
				return res.status(400).json({
					error:
						"Bad request: Error occurred while getting all products from the DB",
				});
			}
			if (!allProducts) {
				return res.status(404).json({
					error: "Not found: No products found on the DB",
				});
			}
			res.json(allProducts);
		});
};

//Get all product
exports.getAllProductHp = (req, res) => {
	//ternary operator used here to check for user input for "limit" which will be treated as string by default
	//Parsing the string value (limit) to integer number is done by parseInt(string)
	let limit = req.query.limit ? parseInt(req.query.limit) : 15;
	let skip = req.query.skip ? parseInt(req.query.skip) : 0;

	//check for user input for "sortBy" & "ascDesc" which will be treated as string by default
	let sortBy = req.query.sortBy ? req.query.sortBy : "name";
	let ascDesc = req.query.ascDesc ? req.query.ascDesc : "asc";
	Product.find()
		.select("-photo")
		.populate("category")
		.sort([[sortBy, ascDesc]])
		.limit(limit)
		.skip(skip)
		.exec((err, allProducts) => {
			if (err) {
				return res.status(400).json({
					error:
						"Bad request: Error occurred while getting all products from the DB",
				});
			}
			if (!allProducts) {
				return res.status(404).json({
					error: "Not found: No products found on the DB",
				});
			}
			res.json(allProducts);
		});
};


exports.getProductByCategory = (req, res) => {
	let limit = req.query.limit ? req.query.limit : 10000;
	let sortBy = req.query.sortBy ? req.query.sortBy : "_id";
	let category = req.category;
	Product.find({ category: category })
	  .select("-photo")
	  .populate("category")
	  .sort([[sortBy, "asc"]])
	  .limit(limit)
	  .exec((err, product) => {
		if (err) {
		  return res.status(400).json({
			error: "No Product Found",
		  });
		}
		res.json(product);
	  });
  };

  exports.getProductByMaterial = (req, res) => {
	let limit = req.query.limit ? req.query.limit : 10000;
	let sortBy = req.query.sortBy ? req.query.sortBy : "_id";
	let material = req.material;
	Product.find({ material: material })
	  .select("-photo")
	  .populate("category")
	  .sort([[sortBy, "asc"]])
	  .limit(limit)
	  .exec((err, product) => {
		if (err) {
		  return res.status(400).json({
			error: "No Product Found",
		  });
		}
		res.json(product);
	  });
  };

  exports.getProductBySize = (req, res) => {
	let limit = req.query.limit ? req.query.limit : 10000;
	let sortBy = req.query.sortBy ? req.query.sortBy : "_id";
	let size = req.size;
	Product.find({ size: size })
	  .select("-photo")
	  .populate("category")
	  .sort([[sortBy, "asc"]])
	  .limit(limit)
	  .exec((err, product) => {
		if (err) {
		  return res.status(400).json({
			error: "No Product Found",
		  });
		}
		res.json(product);
	  });
  };


//Middleware for getting photo
exports.getPhoto = (req, res, next) => {
	if (req.product.photo.data) {
		res.set("content-type", req.product.photo.contentType);
		res.send(req.product.photo.data);
	}
	next();
};

//Delete controller
exports.deleteProduct = (req, res) => {
	let product = req.product;
	product.remove((err, deletedProduct) => {
		if (err) {
			return res.status(400).json({
				error: `Bad request: Error occured while deleting the porduct: ${deletedProduct.name}`,
			});
		}
		return res.json({
			message: `\"${deletedProduct.name}\" has been deleted from database successfully`,
		});
	});
};
//Update controller
exports.updateProduct = (req, res) => {
	const form = formidable.IncomingForm();
	form.keepExtension = true;

	form.parse(req, (err, fields, file) => {
		if (err) {
			return res.status(400).json({
				error: "Bad request: Error occured while parsing file",
			});
		}

		//Fetching product from req.product which is populated using getProductById
		let product = req.product;
		//updating the product object with new data source as fields given by formidable
		product = _.extend(product, fields);

		//Handle files here
		if (file.photo) {
			//file size only upto 3MB is allowed
			if (file.photo.size > 3145728) {
				return res.status(400).json({
					error: "Bad request: File size bigger than 3MB is not allowed",
				});
			}

			//Providing file path and extension details in photo object
			product.photo.data = fs.readFileSync(file.photo.path);
			product.photo.contentType = file.photo.type;
		}

		//Save product to DB
		product.save((err, product) => {
			if (err) {
				return res.status(400).json({
					error: "Bad request: Error occured while updating product info in DB",
				});
			}
			res.json(product);
		});
	});
};

//Update "Sold" and "Stock" parameter for a product
exports.updateStock = (req, res, next) => {
	let myOperations = req.body.order.products.map((prod) => {
		return {
			updateOne: {
				filter: { _id: prod._id },
				update: { $inc: { stock: -prod.quantity, sold: +prod.quantity } },
			},
		};
	});

	Product.bulkWrite(myOperations, {}, (err, product) => {
		if (err || !product) {
			res.status(400).json({
				error: "Bad request: Bulk operation failed",
			});
		}
		next();
	});
};
