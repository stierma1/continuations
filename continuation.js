"use strict"

class Continuation{
  constructor(generator){
    var args = Array.from(arguments);
    args.shift();
    this._genArgs = args;
    this.generatorFunction = generator;
    this.generatorInstance = null;
    this.childContinuation = null;
    this.lastContinueArguments = [];
    this.reset();

  }

  static CONTINUE(){

  }

  initGenerator(){
    this._genArgs = Array.from(arguments);
    this.generatorInstance = this.generatorFunction.apply(this, arguments);
    return this;
  }

  reset(){
    this.lastContinueArguments = [];
    this.childContinuation = null;
    this.initGenerator.apply(this,this._genArgs);
  }

  start(){
    return this.continue.apply(this, arguments);
  }

  continue(){
    this.lastContinueArguments = Array.from(arguments);

    if(this.childContinuation){
      var childData = this.childContinuation.continue.apply(this.childContinuation, this.lastContinueArguments);
        return Promise.resolve(childData)
          .then((cVal) => {
            if(!cVal.done){
              return Promise.resolve(cVal.value)
                .then((cVal2) => {
                  if(cVal2 === Continuation.CONTINUE){
                    return this.continue.apply(this, this.lastContinueArguments);
                  }
                  return {value:cVal2, continue:this.continue.bind(this), reset:this.reset.bind(this), done:cVal.done};
                });
            }
            this.childContinuation = null;
            return this.continue.apply(this, this.lastContinueArguments);
          });
    }

    var data = this.generatorInstance.next.apply(this.generatorInstance, this.lastContinueArguments);
    return Promise.resolve().then(() => {
      return Promise.resolve(data.value);
    })
    .then((val) => {
      if(!data.done && val instanceof Continuation){
        this.childContinuation = val;
        return this.continue.apply(this, this.lastContinueArguments);
      }
      if(val === Continuation.CONTINUE){
        return this.continue.apply(this, this.lastContinueArguments);
      }
      return {value:val, continue:this.continue.bind(this), reset:this.reset.bind(this), done:data.done}
    });
  }
}

module.exports = Continuation;
