var Continuation = require("./continuation");
var chai = require("chai");
var expect = chai.expect;

describe("Continuation", function(){
  it("should construct", function(){
    var cont = new Continuation(function*(){});
    expect(cont).to.not.be.null;
  });

  it("should yield asynchronously", function(done){
    var cont = new Continuation(function*(){
      yield 1;
      yield 2;
    });

    cont.start().then(function(val){
      expect(val.value).to.eql(1);
      done()
    }).catch(done);
  });

  it("should retrive all the values", function(done){
    var cont = new Continuation(function*(){
      yield 1;
      yield 2;
    });

    cont.start().then(function(val){
      expect(val.value).to.eql(1);
      return val.continue();
    })
    .then(function(val){
      expect(val.value).to.eql(2);
      return val.continue();
    })
    .then(function(val){
      expect(val.done).to.be.true;
      done();
    }).catch(done);
  });

  it("should finish child continuations before siblings", function(done){
    var cont = new Continuation(function*(){
      yield new Continuation(function*(){
        yield 1;
        yield 2;
      });
      yield 3;
    });

    cont.start().then(function(val){
      expect(val.value).to.eql(1);
      return val.continue();
    })
    .then(function(val){
      expect(val.value).to.eql(2);
      return val.continue();
    })
    .then(function(val){
      expect(val.value).to.eql(3);
      return val.continue();
    })
    .then(function(val){
      expect(val.done).to.be.true;
      done();
    }).catch(done);
  });

  it("should be resetable", function(done){
    var cont = new Continuation(function*(){
      yield new Continuation(function*(){
        yield 1;
      });
      yield 3;
    });

    cont.start().then(function(val){
      expect(val.value).to.eql(1);
      val.reset();
      return val.continue();
    })
    .then(function(val){
      expect(val.value).to.eql(1);
      return val.continue();
    })
    .then(function(val){
      expect(val.value).to.eql(3);
      return val.continue();
    })
    .then(function(val){
      expect(val.done).to.be.true;
      done();
    }).catch(done);
  });

  it("should be able to jump out", function(done){
    var cont = new Continuation(function*(){
      yield new Continuation(function*(){
        yield Promise.resolve(false).then(function(val){
          if(val){
            return 1;
          }
          return Continuation.CONTINUE;
        });
      });
      yield 3;
    });

    cont.start()
    .then(function(val){
      expect(val.value).to.eql(3);
      return val.continue();
    })
    .then(function(val){
      expect(val.done).to.be.true;
      done();
    }).catch(done);
  });

  it("should be able to feed in values", function(done){
    var cont = new Continuation(function*(){
      var myFeed = yield new Continuation(function*(){
        yield 1;
      });

      yield myFeed;
    });

    cont.start().then(function(val){
      expect(val.value).to.eql(1);
      return val.continue(5);
    })
    .then(function(val){
      expect(val.value).to.eql(5);
      return val.continue();
    })
    .then(function(val){
      expect(val.done).to.be.true;
      done();
    }).catch(done);
  });
});
