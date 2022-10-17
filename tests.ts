
basic.showLeds(`
    . . . # .
    # . # . #
    # . # . #
    # . # . #
    . # . . .
    `)
basic.forever(function () {
    // ucaBot.motors(30, 90)
    basic.pause(1500)
    // ucaBot.motors(90, 30)
    basic.pause(1500)
})
