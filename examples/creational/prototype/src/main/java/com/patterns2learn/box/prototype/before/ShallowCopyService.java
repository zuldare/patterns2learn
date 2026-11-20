package com.patterns2learn.box.prototype.before;

import com.patterns2learn.box.prototype.WeekProgram;

/** Before: the service copies a week by hand, from outside, and only the top level. */
public class ShallowCopyService {
    // @step:shallow
    public WeekProgram duplicate(WeekProgram lastWeek, String newName) {
        return new WeekProgram(newName, lastWeek.days());   // a new list… of the same days
    }
    // @end
}
