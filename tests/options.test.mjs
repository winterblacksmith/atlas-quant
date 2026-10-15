import test from 'node:test';
import assert from 'node:assert/strict';
import {priceEuropeanOptions} from '../dist/assets/quant/options-engine.js';

const input={spot:100,strike:100,years:1,rate:.05,dividendYield:0,volatility:.2};
const price=patch=>priceEuropeanOptions({...input,...patch});
const close=(actual,expected,tolerance=1e-4)=>assert.ok(Math.abs(actual-expected)<tolerance,`${actual} differs from ${expected}`);

test('Black–Scholes–Merton matches standard European option benchmark',()=>{
  const result=price({});
  close(result.call.price,10.45058357);
  close(result.put.price,5.57352602);
  close(result.call.delta,.63683065);
  close(result.put.delta,-.36316935);
  close(result.call.gamma,.01876202);
  close(result.call.vega,37.52403469);
  close(result.parityGap,0,1e-5);
});

test('put–call parity and spot monotonicity hold with dividends',()=>{
  const assumptions={dividendYield:.03,rate:.04,years:2,volatility:.35};
  const low=price({...assumptions,spot:90});
  const high=price({...assumptions,spot:110});
  close(low.parityGap,0,1e-5);
  close(high.parityGap,0,1e-5);
  assert.ok(high.call.price>low.call.price);
  assert.ok(high.put.price<low.put.price);
  assert.ok(low.call.price>=0&&low.put.price>=0);
});

test('Greeks agree with independent finite differences',()=>{
  const base=price({});
  const difference=(field,parameter,step)=>{
    const up=price({[parameter]:input[parameter]+step})[field].price;
    const down=price({[parameter]:input[parameter]-step})[field].price;
    return (up-down)/(2*step);
  };
  for(const field of ['call','put']){
    close(base[field].delta,difference(field,'spot',.001),1e-4);
    close(base[field].vega,difference(field,'volatility',.0001),1e-3);
    close(base[field].rho,difference(field,'rate',.0001),1e-3);
    close(base[field].theta,-difference(field,'years',.0001),1e-3);
  }
  const h=.1;
  close(base.call.gamma,(price({spot:100+h}).call.price-2*base.call.price+price({spot:100-h}).call.price)/(h*h),1e-4);
});

test('values approach intrinsic at expiry and discounted intrinsic as volatility vanishes',()=>{
  const nearExpiry=price({spot:120,years:1e-8});
  close(nearExpiry.call.price,20,1e-4);
  close(nearExpiry.put.price,0,1e-4);
  const nearCertain=price({spot:120,volatility:1e-7});
  close(nearCertain.call.price,120-100*Math.exp(-.05),1e-4);
  close(nearCertain.put.price,0,1e-4);
});

test('invalid assumptions cannot produce a displayed result',()=>{
  for(const patch of [{spot:0},{strike:-1},{years:0},{volatility:0},{rate:NaN},{dividendYield:Infinity}]){
    assert.throws(()=>price(patch));
  }
});
