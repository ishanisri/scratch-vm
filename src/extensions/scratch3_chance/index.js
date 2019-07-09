const randomInt = require('random-int');
const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const random = require('math-random');

const Cast = require('../../util/cast');

class ChanceExtension {
    constructor () {
        this.dice2Value = 1;
        this.dice1Value = 1;
        this.dice1Distribution = '16.666666,16.666666,16.666666,16.666666,16.666666,16.666666';
        this.dice2Distribution = '16.666666,16.666666,16.666666,16.666666,16.666666,16.666666';
    }

    newMethod() {
        return this;
    }

    /**
     * @return {object} This object's metadata.
     */
    getInfo () {
        return {

            id: 'chance', // Machine readable id of this extension.

            name: 'Chance',

            blocks: [
                {
                    opcode: 'dice1',
                    blockType: BlockType.REPORTER,
                    text: 'Dice 1'
                },
                {
                    opcode: 'dice2',
                    blockType: BlockType.REPORTER,
                    text: 'Dice 2'
                },
                {
                    opcode: 'rollDice',
                    blockType: BlockType.COMMAND,
                    text: 'roll [DICE]',
                    arguments: {
                        DICE: {
                            type: ArgumentType.STRING,
                            defaultValue: 'dice1',
                            menu: 'diceMenu'
                        }

                    }
                },
                {   // Block to set the distribution of an entire dice.
                    opcode: 'setDistribution',
                    blockType: BlockType.COMMAND,
                    text: 'set [DICE] sides to [DISTRIBUTION]',
                    arguments: {
                        DICE: {
                            type: ArgumentType.STRING,
                            defaultValue: 'dice1',
                            menu: 'diceMenu'
                        },
                        DISTRIBUTION: {
                            type: ArgumentType.SLIDER,
                            defaultValue: '16.666666,16.666666,16.666666,16.666666,16.666666,16.666666'
                        }
                    }

                },
                {   // Block to set the chance of a particular side of a dice.
                    opcode: 'setChance',
                    blockType: BlockType.COMMAND,
                    text: 'set chance of [DICE] [SIDE] to [CHANCE]',
                    arguments: {
                        DICE: {
                            type: ArgumentType.STRING,
                            defaultValue: 'dice1',
                            menu: 'diceMenu'
                        },
                        SIDE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1,
                            menu: 'sideMenu'
                        },
                        CHANCE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 10
                        }
                    }
                },
                { // Block for a dice that has adjustable distribution and no stored value. It is a reporter and not a variable.
                    opcode: 'makeADice',

                    blockType: BlockType.REPORTER,

                    text: 'dice with properties [DISTRIBUTION]',

                    arguments: {
                        DISTRIBUTION: {
                            type: ArgumentType.SLIDER,
                            defaultValue: '16.666666,16.666666,16.666666,16.666666,16.666666,16.666666'
                        }
                    }

                    
                },

                { // E-block that probabilistically splits into one of two branches.
                    opcode: 'probFork',

                    blockType: BlockType.CONDITIONAL,

                    branchCount: 2,

                    text: [
                        'happens [NUM] out of [DEN] times',
                        'happens all remaining times'
                    ],

                    arguments: {
                        NUM: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1

                        },

                        DEN: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 10
                        }
                        
                    }
                },

                // Dice with uniform distribution that also has no stored value.

                {
                    opcode: 'dice',

                    blockType: BlockType.REPORTER,

                    text: 'dice that has [NUM] sides',

                    arguments: {
                        NUM: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 6
                        }
                    }


                }
            ],

            menus: {
                // Menu that contains all of the dice.
                diceMenu: [
                    {
                        value: 'dice1',
                        text: 'Dice 1'
                    },
                    {
                        value: 'dice2',
                        text: 'Dice 2'
                    }
                ],
                sideMenu: [
                    {
                        value: 1,
                        text: '1'
                    },
                    {
                        value: 2,
                        text: '2'
                    },
                    {
                        value: 3,
                        text: '3'
                    },
                    {
                        value: 4,
                        text: '4'
                    },
                    {
                        value: 5,
                        text: '5'
                    },
                    {
                        value: 6,
                        text: '6'
                    },
                    {
                        value: 7,
                        text: '7'
                    },
                    {
                        value: 8,
                        text: '8'
                    },
                    {
                        value: 9,
                        text: '9'
                    },
                    {
                        value: 10,
                        text: '10'
                    }

                ]
                
            }


        };
    }

    probFork (args, util) {
        
        const probability = Cast.toNumber(args.NUM) / Cast.toNumber(args.DEN);
        if (random() < probability) {
            util.startBranch(1, false);
        } else {
            util.startBranch(2, false);
        }
    }

    dice (args) {
        const numSides = Cast.toNumber(args.NUM);
        return randomInt(1, numSides);
    }


    makeADice (args) {
        const sliders = args.DISTRIBUTION.split(',');
        
        // Convert all the slider array elements from strings into floats.
        for (let i = 0; i < sliders.length; i++) sliders[i] = +sliders[i];
        
        const sliderSums = [sliders[0]];
        for (let i = 1; i < sliders.length; i++) {
            sliderSums.push(sliderSums[sliderSums.length - 1] + sliders[i]);
        }
        const randomNumber = random() * 100.0;
        for (let i = 0; i < sliders.length; i++) {
            if (randomNumber <= sliderSums[i]) {
                return i + 1;
            }
        }
    }
    
    // First dice with stored value.
    dice1 () {
        return this.dice1Value;
    }
    // Second dice with stored value.
    dice2 () {
        return this.dice2Value;
    }

    // Randomly reassign the value of the selected dice according to its distribution.
    rollDice (args) {
        const dice = args.DICE;
        let distribution;
        if (dice === 'dice1') {
            distribution = this.dice1Distribution;
        } else {
            distribution = this.dice2Distribution;
        }
        
        const sliders = distribution.split(',');
        
        // Convert all the slider array elements from strings into floats.
        for (let i = 0; i < sliders.length; i++) sliders[i] = +sliders[i];
        let newValue;
        const sliderSums = [sliders[0]];
        for (let i = 1; i < sliders.length; i++) {
            sliderSums.push(sliderSums[sliderSums.length - 1] + sliders[i]);
        }
        const randomNumber = random() * 100.0;
        for (let i = 0; i < sliders.length; i++) {
            if (randomNumber <= sliderSums[i]) {
                newValue = i + 1;
                break;
            }
        }
        if (dice === 'dice1') {
            
            this.dice1Value = newValue;
        } else {
            this.dice2Value = newValue;
        }

     
    }
    // Change the distribution of a dice.
    setDistribution (args) {
        const dice = args.DICE;
        const distribution = args.DISTRIBUTION;
        if (dice === 'dice1') {
            this.dice1Distribution = distribution;
        } else {
            this.dice2Distribution = distribution;
        }
    }

    setChance (args) {
        const dice = args.DICE;
        let side = args.SIDE;
        const chance = Cast.toNumber(args.CHANCE);
        let difference;
        let currentDist;
        if (dice === 'dice1') {
            currentDist = this.dice1Distribution;
        } else {
            currentDist = this.dice2Distribution;
        }
        // Convert the string distribution to an array.
        let sliders = JSON.parse("[" + currentDist + "]");
        side--;

        // If the current dice does not have that many sides as the user is requesting:
        if (sliders.length <= side) {
            
            difference = -chance / 1.0;
            // Add as many 0's to the slider as needed.
            for (let i = 0; i < (side - sliders.length + 1); i++) {
                sliders.push(0.0);
            }
        // If the distribution array is already long enough:
        } else {
            difference = sliders[side] - chance;
        }
        // Start editing the distribution values.
        let sumOfRest = 0;
        for (let i = 0; i < sliders.length; i++){
            if (i !== side) {
                sumOfRest += sliders[i];
            }
        }
        for (let i = 0; i < sliders.length; i++){
            if (i !== side) {
                if (sumOfRest === 0) {
                    sliders[i] = sliders[i] + (difference / (sliders.length - 1));

                } else {
                    sliders[i] = sliders[i] + (difference * sliders[i] / sumOfRest);
                    if (sliders[i] < 0) {
                        sliders[i] = 0;
                    }
                }
            }
        }

        sliders[side] = chance;
        console.log(sliders);
        if (dice === 'dice1') {
            this.dice1Distribution = sliders.toString();
        } else {
            this.dice2Distribution = sliders.toString();
        }
    }

}
module.exports = ChanceExtension;
