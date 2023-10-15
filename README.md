# Standardized API responses for NestJS

A big part of NestJS power comes from interceptors

- Metadata-based wrapper to provide customizable standardized API response objects;
- Allows route handlers to keep returning classes instead of wrapper objects, so they remain fully compatible with interceptors;
- Optional built-in handling of pagination, sorting and filtering;



- Standardized API responses, including:
  - Automatic wrapping of the route handlers return object into a StandardResponse
  - Generation of OpenAPI documentation for routes with proper response schema
  - Generation of OpenAPI response examples with proper serialization for each user role

<br />

# Getting started

## 🚀 &nbsp; Install

```shell
$ npm install nest-standard-response
```
</br>

## 🔮 &nbsp; Add to your app's ```imports``` array

```app.module.ts```

```ts
import { StandardResponseModule } from 'nest-standard-response';

@Module({
  imports: [
    StandardResponseModule.forRoot(options), // options can be ommited
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

<blockquote>

Check out the options that this module accepts in the [Advanced Configuration](#StandardResponseConfiguration) section.

</blockquote>

</br>

## 📦 &nbsp; All routes are now wrapped

By default, all routes are automatically wrapped in a standard response object:

<table style="width: 100%">
<tr>
<td>

```ts
// route returns dtos
@get("/books")
listBooks(): BookDto[] {
  const books = [
    new BookDto({ title: "Dune", year: 1965 }),
    new BookDto({ title: "Jaws", year: 1974 }),
    new BookDto({ title: "Emma", year: 1815 }),
  ];
  return books;
}
```

</td>
<td>

```ts
// but response is wrapped
{
  success: true,
  isArray: true, // auto infered
  data: [
    { title: "Dune", year: 1965 },
    { title: "Jaws", year: 1974 },
    { title: "Emma", year: 1815 },
  ]
}
```

</td>
</tr>
</table>

> To skip wrapping a particular route, just decorate the handler with [@RawResponse()](#RawResponseDecorator).

> It's possible to **invert** this behavior to **not wrap** any route automatically, and only wrap routes annotated with [@StandardResponse()](#StandardResponseDecorator) instead. [Check out how](#StandardResponseConfiguration-interceptAll).

<br />


## 🚦 &nbsp; Wrapping only happens at the end of the NestJS' request pipeline

So interceptors like ```ClassSerializer``` and ```RoleSerializer``` work transparently without any custom logic.

</br>

## 🔥 &nbsp; Add features to your route

Just decorate a route with [@StandardResponse({...options})](#StandardResponseDecorator) and pass in the options you want. Adding features will:

- Automatically prepare a route to receive query parameters for that feature;
- Parse and validate the input of these query parameters, and make them injectable into the handler;
- Add fields to the response object to let the client know the state of these features (and to allow discoverability of defaults when the route is called without any query params);
- Add documentation to Swagger with fully qualified schemas and examples;

To access this information during the request, use the [@StandardParam()](#StandardParamDecorator) parameter decorator to inject a params object into your handler. This object contains the parsed  query params, all configuration values set for StandardResponse, plus methods to manipulate how this data shows up in the response.

<table style="width: 100%">
<tr>
<td>

```ts
// route
@get("/books")
@StandardResponse({ isPaginated: true })
async listBooks(
  @StandardParam() params: StandardParams
): BookDto[] {
  const {
    books,
    count
  } = await this.bookService.list({
    // already validated values safe to use
    limit: params.pagination.limit,
    offset: params.pagination.offset,
  });
  // add extra information into the response
  params.setPaginationInfo({ count: count })
  return books;
}
```

</td>
<td>

```ts
// response
{
  success: true,
  isArray: true,
  isPaginated: true,
  pagination: {
    limit: 10,
    offset: 0,
    defaultLimit: 10,
    // 👇 added in handler
    count: 33
  },
  data: [
    { title: "Dune", year: 1965 },
    { title: "Jaws", year: 1974 },
    { title: "Emma", year: 1815 },
  ]
}
```

</td>
</tr>
</table>

<br />

## 🎁 &nbsp; Combine features!

Features can be freely combined, or used all at once.

For example, calling this route as:

>```/books?limit=8&offset=16&sort=-author,title&filter=author^=Frank;year>=1960;year>=1970```  
> Note: This url was NOT url-encoded for readability (but you would need to encode yours)

<table style="width: 100%">
<tr>
<td>

```ts
// route
@get("/books")
@StandardResponse({
  // declare type to get OpenApi documentation
  type: [BookDto],
  isPaginated: true,
  defaultLimit: 12,
  maxLimit: 20,
  isSorted: true,
  sortableFields: ["title", "author"],
  isFiltered: true,
  filterableFields: ["author", "year"],
})
async listBooks(
  @StandardParam() params: StandardParams
): BookDto[] {
  const { books, count } = await this.bookService.list({
    limit: params.pagination.limit,
    offset: params.pagination.offset,
    sort: params.sorting.sort,
    filter: params.filtering.filter,
  });
  // add extra information into the response
  params.setPaginationInfo({ count: count })
  params.setMessage('A full-featured example!')
  return books;
}



```

</td>
<td>

```ts
// response
{
  success: true,
  message: "A full-featured example!",
  isArray: true,
  isPaginated: true,
  isSorted: true,
  isFiltered: true,
  pagination: {
    query: "limit=8&offset=16",
    limit: 8,
    offset: 16,
    defaultLimit: 12,
    maxLimit: 20,
    count: 33
  },
  sorting: {
    sortableFields: ["title", "author"],
    query: "-author,title",
    sort: {}
  },
  filtering: {
    filterableFields: ["author", "year"],
    query: "author^=Frank;year>=1960;year>=1970",
    filter: {}
  },
  data: [ ... ]
}
```

</td>
</tr>
</table>

<br />

---------------------------------------------------------------------------

<br />

# Reference
* [@StandardResponse()](#StandardResponseDecorator) <sup>decorator</sup>
  * [StandardResponseOptions](#StandardResponseOptions)
* [@RawResponse()](#RawResponseDecorator) <sup>decorator</sup>
* [@StandardParam()](#StandardParamDecorator) <sup>parameter decorator</sup>
* [Advanced Configuration](#StandardResponseConfiguration)

</br>

To set up, just add ```StandardResponseModule.forRoot()``` in the imports array of your application module.

```ts
@Module({
  imports: [
    StandardResponseModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

</br>

> This is a dynamic module. It can also accept a configuration object like this:  
> ```StandardResponseModule.forRoot(options: {})```  
> For options, see [advanced configuration](#StandardResponseConfiguration).  

</br>
</br>

## 🟠 &nbsp; @StandardResponse(_options?:_ [_StandardResponseOptions_](#StandardResponseOptions)) <a name="StandardResponseDecorator"></a>

<br />

A decorator that wraps the return of a route into a standardized API response object (while still allowing the handler to return true DTOs or other model class instances).

This makes interceptors like caching, ```ClassSerializer```, or ```RoleSerializer``` work transparently.

The wrapper allows custom messages to be set in the response, and has optional features to handle common tasks, like **pagination, sorting and filtering**.

It can also optionally apply swagger's documentation, providing the correct combined schema for the DTO and the wrapper including any of its features. If given an array of Roles, it can also build Swagger route response examples for each user role, containing the reponse as it would be serialized for that user group.

<br/>

``` ts
import { UserDto } from './dto/user.dto';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  @Get('/')
  @StandardResponse({ type: [UserDto] })
  async findAll(): Promise<UserDto[]> {
    const users = await this.usersService.findAll();
    return users // <--- returns an array of UserDtos
  }
}

// get /api/users
// Response:
{
  "success": true,
  "isArray": true,
  "data": [
    Users... // <--- The returned array is delivered inside the data property
  ]
}
```

(TODO image of swagger UI with the response examples dropdown open. Comparing a response for User and Admin, with arrows showcasing the extra fields returned only to admin)

<br />
<br />

## 🔸 &nbsp; StandardResponseOptions <a name="StandardResponseOptions"></a>

<br />

<table>
  <tr>
    <th>Option</th>
    <th>Type</th>
    <th>Description</th>
  </tr>
  <tr>
    <td>type</td>
    <td><i>Class</i></td>
    <td>The class that represents the object(s) that will be returned from the route (for example, a Model or a DTO). This option is required to get auto-documentation.</td>
  </tr>
  <tr>
    <td>description</td>
    <td><i>string</i></td>
    <td>Used as the desciption field of the response in the OpenAPI docs.</td>
  </tr>
  <tr>
    <td>isPaginated</td>
    <td><i>boolean</i></td>
    <td>Mark the route to serve paginated responses, and allow the use of pagination options. This will capture and validate <code>limit</code> and <code>offset</code> query parameters, and make them available in the handler via <code>@StandardParam</code>. Also sets up pagination fields in the response object. </td>
  </tr>
  <tr>
    <td>isSorted</td>
    <td><i>boolean</i></td>
    <td>Mark the route to serve sorted responses, and allow the use of sorting options. This will capture and validate the <code>sort</code> query parameter, and make it available in the handler via <code>@StandardParam</code>. Also sets up sorting fields in the response object. </td>
  </tr>
  <tr>
    <td>isFiltered</td>
    <td><i>boolean</i></td>
    <td>Mark the route to serve filtered responses, and allow the use of filtering options. This will capture and validate the <code>filter</code> query parameter, parse it into a <code>FilteringQuery</code>, an and make it available in the handler via <code>@StandardParam</code>. Also sets up filtering fields in the response object. </td>
  </tr>
  <tr>
    <th colspan="3"></th>
  </tr>
  <tr>
    <td>defaultLimit</td>
    <td><i>number</i></td>
    <td><i><b>(Pagination option) </b></i>The value to used for <code>limit</code> if the query param is missing. <i><b>(Defaults to 10)</b></i></td>
  </tr>
  <tr>
    <td>maxLimit</td>
    <td><i>number</i></td>
    <td><i><b>(Pagination option) </b></i>The maximum value accepted by the <code>limit</code> query param.</td>
  </tr>
  <tr>
    <td>minLimit</td>
    <td><i>number</i></td>
    <td><i><b>(Pagination option) </b></i>The minimum value accepted by the <code>limit</code> query param.</td>
  </tr>
  <tr>
    <th colspan="3"></th>
  </tr>
  <tr>
    <td>sortableFields</td>
    <td><i>string[]</i></td>
    <td><i><b>(Sorting option) </b></i>A list of fields that can used for sorting. If left undefined, all fields will be accepted. An empty array allows no fields.</td>
  </tr>
  <tr>
    <th colspan="3"></th>
  </tr>
  <tr>
    <td>filterableFields</td>
    <td><i>string[]</i></td>
    <td><i><b>(Filtering option) </b></i>A list of fields that can used for filtering. If left undefined, all fields will be accepted. An empty array allows no fields.</td>
  </tr>
</table>

<br />

---------------------------------------------------

</br>

## 🟠 &nbsp; @StandardParam() <a name="StandardParamDecorator"></a>

<br />

A parameter decorator used to inject a ```StandardParams``` object in the route handler.

This object allows access to:

* All options set in ```@StandardResponse()```;
* Information captured from query parameters, parsed and validated;
* Methods to include and modify fields in the response object;

<br />

``` ts
import { UserDto } from './dto/user.dto';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  @Get('/')
  @StandardResponse({
    type: [UserDto],
    isPaginated: true,
    maxLimit: 24,
    defaultLimit 12,
  })
  async findAll(
    @StandardParam() params: StandardParams // <--- inject into handler
  ): Promise<UserDto[]> {
    const [users, count] = await this.usersService.findAll({
      limit: params.pagination.limit,
      offset: params.pagination.offset,
    });
    params.setPaginationInfo({ count: 348 }) // <--- set additional info
    return users;
  }
}

// get /api/users?limit=15&offset=30
// Response:
{
  "success": true,
  "isArray": true,
  "isPaginated": true,
  "pagination: {
    count: 348, // <--- added inside the handler
    limit: 15, // <--- from query
    offset: 30,
    maxLimit: 24, // <--- from decorator options
    defaultLimit: 12,
  }
  "data": [
    Users...
  ]
}
```

<br />

The params object injected with @StandardParam() contains these keys:

<table style="width: 100%;">
  <tr>
    <th>Key</th>
    <th>Type</th>
    <th>Description</th>
  </tr>
  <tr>
    <td>pagination</td>
    <td><i>PaginationInfo</i></td>
    <td>Only available when the response <code>isPaginated</code> option is <code>true</code>.</td>
  </tr>
  <tr>
    <td>sorting</td>
    <td><i>SortingInfo</i></td>
    <td>Only available when the response <code>isSorted</code> option is <code>true</code>.</td>
  </tr>
  <tr>
    <td>filtering</td>
    <td><i>FilteringInfo</i></td>
    <td>Only available when the response <code>isFiltered</code> option is <code>true</code>.</td>
  </tr>
  <tr>
    <td>setPaginationInfo()</td>
    <td><i>(info: {}) => void</i></td>
    <td>Allows modifying the pagination metadata inside the route handler to add extra information or to reflect some dynamic condition. For example, to add a pagination <code>count</code>. The object passed to this method will be merged with the current information, so partial updates are OK.</td>
  </tr>
  <tr>
    <td>setSortingInfo()</td>
    <td><i>(info: {}) => void</i></td>
    <td>Allows modifying the sorting metadata inside the route handler.</td>
  </tr>
  <tr>
    <td>setFilteringInfo()</td>
    <td><i>(info: {}) => void</i></td>
    <td>Allows modifying the filtering metadata inside the route handler.</td>
  </tr>
  <tr>
    <td>setMessage()</td>
    <td><i>(message: string) => void</i></td>
    <td>Allows setting a custom message in the response object.</td>
  </tr>
</table>

<br />

## 🔸 &nbsp; PaginationInfo

<table style="width: 100%;">
  <tr>
    <th>Property</th>
    <th>Type</th>
    <th>Description</th>
  </tr>
  <tr>
    <td>query?</td>
    <td><i>string</i></td>
    <td>The original string from the request for the <code>limit</code> and <code>offset</code> query params. <b>[ReadOnly]</b></td>
  </tr>
  <tr>
    <td>limit?</td>
    <td><i>number</i></td>
    <td>How many items to send. This is the same as the <code>limit</code> query param, but parsed and validated.</td>
  </tr>
  <tr>
    <td>offset?</td>
    <td><i>number</i></td>
    <td>How many items to skip. This is the same as the <code>offset</code> query param, but parsed and validated.</td>
  </tr>
  <tr>
    <td>count?</td>
    <td><i>number</i></td>
    <td>The total count of items that are being paginated. This value needs to be set inside the handler using the <code>setPaginationInfo()</code> method.</td>
  </tr>
  <tr>
    <td>maxLimit?</td>
    <td><i>number</i></td>
    <td>The maximum value accepted by the <code>limit</code> query param. <b>[ReadOnly]</b> <i>(From the options set in <code>@StandardResponse()</code>).</i></td>
  </tr>
  <tr>
    <td>minLimit?</td>
    <td><i>number</i></td>
    <td>The minimum value accepted by the <code>limit</code> query param. <b>[ReadOnly]</b> <i>(From the options set in <code>@StandardResponse()</code>).</i></td>
  </tr>
  <tr>
    <td>defaultLimit?</td>
    <td><i>number</i></td>
    <td>The default number of items to send if no query <code>limit</code> is provided. <b>[ReadOnly]</b> <i>(From the options set in <code>@StandardResponse()</code>).</i></td>
  </tr>
</table>

<br />
<br />
<br />

## 🔸 &nbsp; SortingInfo

<table style="width: 100%;">
  <tr>
    <th>Property</th>
    <th>Type</th>
    <th>Description</th>
  </tr>
  <tr>
    <td>query?</td>
    <td><i>string</i></td>
    <td>The original string from the request for the <code>sort</code> query param.</td>
  </tr>
  <tr>
    <td>sortableFields?</td>
    <td><i>string[]</i></td>
    <td>A list of all the fields that can used for sorting. <b>[ReadOnly]</b> <i>(From the options set in <code>@StandardResponse()</code>).</i></td>
  </tr>
  <tr>
    <td>sort?</td>
    <td><i>SortingOperation[]</i></td>
    <td>An array of <code>SortingOperation</code> objects parsed from the query.</td>
  </tr>
  <tr><td colspan="3">&nbsp;</td></tr>
  <tr>
    <th colspan="3">SortingOperation<th>
  </tr>
  <tr>
    <td>field</td>
    <td><i>string</i></td>
    <td>The name of the field being sorted.</td>
  </tr>
  <tr>
    <td>order</td>
    <td><i>'asc' | 'des'</i></td>
    <td>Order of the sorting operation. These strings are available in an enum for static typing: <code>SortingOrder.ASC</code> and <code>SortingOrder.DES</code>.</td>
  </tr>
</table>

<br />
<br />
<br />

## 🔸 &nbsp; FilteringInfo

<table style="width: 100%;">
  <tr>
    <th>Property</th>
    <th>Type</th>
    <th>Description</th>
  </tr>
  <tr>
    <td>query?</td>
    <td><i>string</i></td>
    <td>The original string from the request for the <code>filter</code> query param.</td>
  </tr>
  <tr>
    <td>filterableFields?</td>
    <td><i>string[]</i></td>
    <td>A list of all the fields that can used for filtering. <b>[ReadOnly]</b> <i>(From the options set in <code>@StandardResponse()</code>).</i></td>
  </tr>
  <tr>
    <td>filter?</td>
    <td><i>{ allOf: FilteringQueryGroup[] }</i></td>
    <td>Filter is an object parsed from the query containing a single property: <b>allOf</b>. This is an array of <code>FilteringQueryGroup</code> objects. All of these filter groups should be combined using an <b>AND</b> operation.</td>
  </tr>
  <tr><td colspan="3">&nbsp;</td></tr>
  <tr>
    <th colspan="3">FilteringQueryGroup<th>
  </tr>
  <tr>
    <td>anyOf</td>
    <td><i>FilteringQueryOperation[]</i></td>
    <td>An array of <code>FilteringQueryOperation</code> objects. These filters should be combined using an <b>OR</b> operation.</td>
  </tr>
  <tr><td colspan="3">&nbsp;</td></tr>
  <tr>
    <th colspan="3">FilteringQueryOperation<th>
  </tr>
  <tr>
    <td>field</td>
    <td><i>string</i></td>
    <td>Name of the field to filter on.</td>
  </tr>
  <tr>
    <td>operation</td>
    <td><i>string</i></td>
    <td>The comparison operation to perform. Possible operators are bellow.
    </td>
  </tr>
  <tr>
    <td>value</td>
    <td><i>string</i></td>
    <td>Value used for the comparison.</td>
  </tr>
  <tr><td colspan="3">&nbsp;</td></tr>
  <tr>
    <th colspan="3">Operations<th>
  </tr>
  <tr>
    <td>==</td>
    <td><i>Equals</i></td>
    <td>.</td>
  </tr>
  <tr>
    <td>!=</td>
    <td><i>Not Equals</i></td>
    <td>.</td>
  </tr>
  <tr>
    <td><=</td>
    <td><i>Less than or equal</i></td>
    <td>.</td>
  </tr>
  <tr>
    <td><</td>
    <td><i>Less than</i></td>
    <td>.</td>
  </tr>
  <tr>
    <td>>=</td>
    <td><i>More than or equal</i></td>
    <td>.</td>
  </tr>
  <tr>
    <td>></td>
    <td><i>More than</i></td>
    <td>.</td>
  </tr>
  <tr>
    <td>!@</td>
    <td><i>Contains</i></td>
    <td>.</td>
  </tr>
  <tr>
    <td>!@</td>
    <td><i>Does not contain</i></td>
    <td>.</td>
  </tr>
  <tr>
    <td>=^</td>
    <td><i>Starts with</i></td>
    <td>.</td>
  </tr>
  <tr>
    <td>=$</td>
    <td><i>Ends with</i></td>
    <td>.</td>
  </tr>
</table>

</br >

<blockquote>
These rules are similar to other APIs like <a href="https://developers.google.com/analytics/devguides/reporting/core/v3/reference#filters">Google Analytics</a> or <a href="https://developer.matomo.org/api-reference/reporting-api-segmentation">Matomo Analytics</a>.
</blockquote>

</br>

## 🔸 &nbsp; Building the search query

When building a query, all **AND** operations should be separated by a **semicolon (;)**, and all **OR** operations should be separed by a **comma (,)**. For example:

This query will filter all books available for lending, which were first published in France OR Italy, between 1970 AND 1999, whose author starts with Vittorio OR ends with Alatri:

```
available==true;country==France,country==Italy;year>=1970;year<=1999;author=^Vittorio,author=$Alatri
```

The resulting parsed object from this query will be:

```ts
{ allOf: [
  { anyOf: [
    { field: 'available', operation: '==', value: true },
  ]},
  { anyOf: [
    { field: 'country', operation: '==', value: 'France' },
    { field: 'country', operation: '==', value: 'Italy' },
  ]},
  { anyOf: [
    { field: 'year', operation: '>=', value: 1970 },
  ]},
  { anyOf: [
    { field: 'year', operation: '<=', value: 1999 },
  ]},
  { anyOf: [
    { field: 'author', operation: '=^', value: 'Vittorio' },
    { field: 'author', operation: '=$', value: 'Alatri' },
  ]},
]}
```
</br>

---------------------------------------------------

</br>

## 🟠 &nbsp;  @RawResponse() <a name="RawResponseDecorator"></a>

<br />

The default behavior of StandardResponse is to wrap the response from all routes application wide. This keeps the API consistent and predictable. However, if you need to skip this behavior for a particular route, just set the ```@RawResponse()``` decorator:

```ts
@Controller('external-api-integration')
export class ExternalApiIntegrationController {
  @Get('/')
  @RawResponse() // <--- will skip wrapping
  async findAll(): Promise<SomeCustomObject> {
    return customObject;
  }
}
```


If you're adding StandardResponse into an existing app, it might be useful to invert this behavior to create a gradual transition path. To do this, set the ```interceptAll``` option to ```false``` when importing the ```StandardResponseModule``` in your application. This way, routes will only be wrapped if they have explicitly set the ```@StandardResponse()``` decorator. See more information in the "Configuring" section bellow.

</br>

---------------------------------------------------

</br>
</br>
</br>

# Advanced configuration <a name="StandardResponseConfiguration"></a>

## ✅ validateResponse

Allows you to provide a validation function to stop the return of a route if certain conditions are met.

For example: this can abort a request if a route tries to return — instead a DTO — a raw DB document or some other object that may leak information not intended to be exposed.

This function should return ```false``` to abort the request.

```ts
@Module({
  imports: [
    StandardResponseModule.forRoot({
      validateResponse: (data) => {
        if (isMongooseObject(data)) return false;
        return true;
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

<br/>

## ✅ interceptAll <a name="StandardResponseConfiguration-interceptAll"></a>

Setting ```interceptAll``` to ```false``` will invert the default behavior of wrapping all routes by default, and will instead only wrap routes decorated with ```@StandardResponse()```.

```ts
@Module({
  imports: [
    StandardResponseModule.forRoot({
      interceptAll: false
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

<br />
<br />
<br />

---------------------------------------------------

<br />

## 🚀 &nbsp; TODO Milestones

- Allow setting any custom field in the repsonse object by exposing a method in the StandardParam: ```setExtra(field, value)```;

</br>


🏭 ⭐️ 🕹️ 💡 💎 🔩 ⚙️ 🧱 🔮 💈 🛍️ 🎁 🪭 ⚜️ ❇️ 🚩
📦 🏷️ 📮 
🟠 🟧 🔶 🔸