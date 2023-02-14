

const taxBands = [
  {
    // basic rate
    max: 37700,
    rate: 0.2,
    div: 0.0875,
    savings: 1000
  },
  {
    // higher rate
    max: 150000,
    rate: 0.4,
    div: 0.3375,
    savings: 500
  },
  {
    // additional rate
    rate: 0.45,
    div: 0.3935,
    savings: 0
  }
];

const nationalIns =[
    { 
        // any income falling in this range does not have ni credits
        max: 6396, 
        rate: 0
    },
    {
        // lower earning limit ^^
        max: 12570,  
        rate: 0
    },
    {
        // primary theshold ^^
        max: 50270,
        rate: 0.1325
    },
    {
        // upper earnings limit
        rate: 0.0325
    }

];



function calculateTax(income) {
    let total = income.salary + income.savings + income.dividends;
    let personalAllowance = personalA(total);
    let taxableIncome = Object.assign({}, income);

     // Allowances
     let dividendsAllowance = 2000;
     let savingsAllowance = savingPersA(Math.max(total - personalAllowance, 0)) + 
         savingStartA(income.salary + income.dividends);
     

    // deduct savings allowance
    taxableIncome.savings = Math.max(taxableIncome.savings - savingsAllowance, 0);

    // deduct dividends allowance
    taxableIncome.dividends = Math.max(taxableIncome.dividends - dividendsAllowance, 0);


     // determine taxable income
     for (const type in taxableIncome){
         let diff = personalAllowance - taxableIncome[type];
         
         if (personalAllowance === 0){
             break;
            }
            // pa > type (pa rolled over)
            if (diff > 0)
            {
                taxableIncome[type] = 0;
                personalAllowance = diff;
            } 
            // type >= pa (no pa left)
            else 
            {
                taxableIncome[type] -= personalAllowance;
                personalAllowance = 0;
            }
            
        }
        

    let tax = 0;
    let lowerband = 0;

    let nic = 0;
    let lowerlimit = 0;

    let divTax = 0;

    let nonDivIncome = taxableIncome.salary + taxableIncome.savings;

    // salary check
    for (const band of taxBands) {
    
        if (!band.max || nonDivIncome <= band.max) {
            tax += (nonDivIncome - lowerband) * band.rate;
            break;
        } else {
            tax += (band.max - lowerband) * band.rate;
            lowerband = band.max;
        }
    }


    if (taxableIncome.dividends > 0)
    {
        let dividends = taxableIncome.dividends;
        let start = nonDivIncome;
        let totalIncome = nonDivIncome + taxableIncome.dividends;

        for (const band of taxBands)
        {
            // check if reached final tax band
            if(!band.max)
            {
                divTax += dividends * band.div;
                break;
            }

            //  if starting point is within tax band
            if (start <= band.max)
            {
                if (totalIncome > band.max)
                {
                    let incomeAtBand = band.max - start;

                    divTax += incomeAtBand * band.div;
                    start = band.max;
                    dividends -= incomeAtBand;
                }
                else
                {
                    divTax += dividends * band.div;
                    break;
                }
            }
        }
    }

  

    for (const band of nationalIns) {   

        if (!band.max || income.salary <= band.max) {
            nic += (income.salary - lowerlimit) * band.rate;
            break;
        } else {
            nic += (band.max - lowerlimit) * band.rate;
            lowerlimit = band.max;
        }
    }

    tax = Math.round(tax);
    divTax = Math.round(divTax);
    nic = Math.round(nic);
    rate = hourlyRate(income.salary).toFixed(2);


    $("#result").html(`<p> your tax is: £${tax.toLocaleString("en-GB")} and £${divTax.toLocaleString("en-GB")} 
    </p> <p> your NIC is: £${nic.toLocaleString("en-GB")} </p> 
    <p> your net income after taxes is: £${(total - tax - nic - divTax).toLocaleString("en-GB")}</p>
    <p> your hourly rate is £${rate} </p>`);


}

// event of submitting form



$("form").on("submit", function (e) {

    e.preventDefault();
    var userIncome = {};

    userIncome.salary = Number($("#salary").val());
    userIncome.savings = Number($("#interest").val());
    userIncome.dividends = Number($("#dividends").val());

    calculateTax(userIncome);
    
});

//  dependent on net income
function personalA(income){
    let pA = 12570;

    if (income < 100000){
        return pA;
    }
    else if (income - 100000 > 2 * pA)
    {
        return 0;
    }
    
    return pA - Math.floor((income - 100000)/2);
    
}

//  dependent on net income after personal allowance deduction
function savingPersA(income){
    let allowance = 0;

    for (const band of taxBands)
    {
        if (income <= band.max) 
        {
            allowance = band.savings;
            break;
        }
    
    }

    return allowance;
    
}

// dependant on all non-savings income
function savingStartA(income) {

    let allowance = 5000;
    let pA = 12570;

    if (income <= pA)
    {
        return allowance;
    }
    else if (income >= allowance + pA)
    {
        return 0;
    }
    
    return allowance - (income - pA);

}

function dummy(){
    var userIncome = {};

    userIncome.salary = Number($("#salary").val());
    userIncome.savings = Number($("#interest").val());
    userIncome.dividends = Number($("#dividends").val());

    console.log( userIncome.salary + userIncome.savings + userIncome.dividends);
    
}


// taxable benifits
// seperate savings tax
// pension contributions

function hourlyRate (salary){
    let workingDays = 250;
    let annuaLeave = 30;
    let hoursPerDay = 7;


    return salary/((workingDays + annuaLeave) * hoursPerDay);

}

