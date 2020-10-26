class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }
  // eslint-disable-next-line lines-between-class-members
  filter() {
    console.log('Filtering');

    //1 A) Filtering
    const queryObj = { ...this.queryString }; //destructuring simple create new object
    //   3 dots will take all thr field out of obj req.query will create new objeect

    const excludeFields = ['page', 'sort', 'limit', 'fields'];
    excludeFields.forEach((el) => delete queryObj[el]); //deleting exludeFields from queryObj

    // console.log(req.query, queryObj);

    // 1 B) Advanced Filtering)
    //Cnverting obj to string
    let queryString = JSON.stringify(queryObj);
    queryString = queryString.replace(
      /\b(gte|lte|gt|lt)\b/g,
      (match) => `$${match}`
    );

    this.query = this.query.find(JSON.parse(queryString));
    //  let query = Tour.find(JSON.parse(queryString)); //this will return a query}
    return this;
  }
  //this simply the entire object for next sort method

  sort() {
    if (this.queryString.sort) {
      // console.log(this.queryString.sort);
      const sortBy = this.queryString.sort.split(',').join(' '); //, is for spliting and jion to join
      console.log('lol', sortBy);
      this.query = this.query.sort(sortBy);
      //sort('price','rating')
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
    // 3) field Limiting
  }
  // eslint-disable-next-line lines-between-class-members
  limitFields() {
    // 3) field Limiting
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v'); //minus we are excluding only this fields
    }
    return this;
  }

  pagination() {
    // 4) Pagination
    //Dafualt value if the  1million it should not show all data so thts y we are adding default value
    const page = this.queryString.page * 1 || 1; //bydiffult it is 1
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;
    //page=2&limit=10, 1-10 , page 1, 11-20 , page 2, 21 - 30 page 3
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

module.exports = APIFeatures;
